/*
 *  Copyright (C) 1999-2001 Harri Porten (porten@kde.org)
 *  Copyright (C) 2001 Peter Kelly (pmk@post.com)
 *  Copyright (C) 2003-2023 Apple Inc. All rights reserved.
 *
 *  This library is free software; you can redistribute it and/or
 *  modify it under the terms of the GNU Library General Public
 *  License as published by the Free Software Foundation; either
 *  version 2 of the License, or (at your option) any later version.
 *
 *  This library is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 *  Library General Public License for more details.
 *
 *  You should have received a copy of the GNU Library General Public License
 *  along with this library; see the file COPYING.LIB.  If not, write to
 *  the Free Software Foundation, Inc., 51 Franklin Street, Fifth Floor,
 *  Boston, MA 02110-1301, USA.
 *
 */

#pragma once

#include "ArgList.h"
#include "CallFrame.h"
#include "CommonIdentifiers.h"
#include "EnsureStillAliveHere.h"
#include "GCOwnedDataScope.h"
#include "GetVM.h"
#include "Identifier.h"
#include "PropertyDescriptor.h"
#include "PropertySlot.h"
#include "Structure.h"
#include "ThrowScope.h"
#include <array>
#include <wtf/CheckedArithmetic.h>
#include <wtf/ForbidHeapAllocation.h>
#include <wtf/MathExtras.h>
#include <wtf/text/StringView.h>

#if OS(DARWIN)
#include <mach/vm_param.h>
#endif

namespace JSC {

class JSString;
class JSRopeString;
class LLIntOffsetsExtractor;

JSString* jsEmptyString(VM&);
JSString* jsString(VM&, const String&); // returns empty string if passed null string
JSString* jsString(VM&, String&&); // returns empty string if passed null string
JSString* jsString(VM&, const AtomString&); // returns empty string if passed null string
JSString* jsString(VM&, AtomString&&); // returns empty string if passed null string
JSString* jsString(VM&, StringView); // returns empty string if passed null string

JSString* jsString(VM&, RefPtr<AtomStringImpl>&&);
JSString* jsString(VM&, Ref<AtomStringImpl>&&);
JSString* jsString(VM&, Ref<StringImpl>&&);

JSString* jsSingleCharacterString(VM&, UChar);
JSString* jsSingleCharacterString(VM&, LChar);
JSString* jsSubstring(VM&, const String&, unsigned offset, unsigned length);

// Non-trivial strings are two or more characters long.
// These functions are faster than just calling jsString.
JSString* jsNontrivialString(VM&, const String&);
JSString* jsNontrivialString(VM&, String&&);

// Should be used for strings that are owned by an object that will
// likely outlive the JSValue this makes, such as the parse tree or a
// DOM object that contains a String
JSString* jsOwnedString(VM&, const String&);

bool isJSString(JSCell*);
bool isJSString(JSValue);
JSString* asString(JSValue);

// In 64bit architecture, JSString and JSRopeString have the following memory layout to make sizeof(JSString) == 16 and sizeof(JSRopeString) == 32.
// JSString has only one pointer. We use it for String. length() and is8Bit() queries go to StringImpl. In JSRopeString, we reuse the above pointer
// place for the 1st fiber. JSRopeString has three fibers so its size is 48. To keep length and is8Bit flag information in JSRopeString, JSRopeString
// encodes these information into the fiber pointers. is8Bit flag is encoded in the 1st fiber pointer. length is embedded directly, and two fibers
// are compressed into 12bytes. isRope information is encoded in the first fiber's LSB.
//
// Since length of JSRopeString should be frequently accessed compared to each fiber, we put length in contiguous 32byte field, and compress 2nd
// and 3rd fibers into the following 80byte fields. One problem is that now 2nd and 3rd fibers are split. Storing and loading 2nd and 3rd fibers
// are not one pointer load operation. To make concurrent collector work correctly, we must initialize 2nd and 3rd fibers at JSRopeString creation
// and we must not modify these part later.
//
//              0                        8        10               16          20           24           26           28           32
// JSString     [   ID      ][  header  ][   String pointer      0]
// JSRopeString [   ID      ][  header  ][   1st fiber         xyz][  length  ][2nd lower32][2nd upper16][3rd lower16][3rd upper32]
//                                                               ^
//                                            x:(is8Bit),y:(isSubstring),z:(isRope) bit flags
class JSString : public JSCell {
public:
    friend class JIT;
    friend class VM;
    friend class SpecializedThunkJIT;
    friend class JSRopeString;
    friend class MarkStack;
    friend class SlotVisitor;
    friend class SmallStrings;

    typedef JSCell Base;
    // Do we really need OverridesGetOwnPropertySlot?
    // FIXME: https://bugs.webkit.org/show_bug.cgi?id=212956
    // Do we really need InterceptsGetOwnPropertySlotByIndexEvenWhenLengthIsNotZero?
    // FIXME: https://bugs.webkit.org/show_bug.cgi?id=212958
    static constexpr unsigned StructureFlags = Base::StructureFlags | OverridesGetOwnPropertySlot | InterceptsGetOwnPropertySlotByIndexEvenWhenLengthIsNotZero | StructureIsImmortal | OverridesPut;

    static constexpr bool needsDestruction = true;
    static void destroy(JSCell*);

    // We specialize the string subspace to get the fastest possible sweep. This wouldn't be
    // necessary if JSString didn't have a destructor.
    template<typename, SubspaceAccess>
    static GCClient::IsoSubspace* subspaceFor(VM& vm)
    {
        return &vm.stringSpace();
    }

    // We employ overflow checks in many places with the assumption that MaxLength
    // is INT_MAX. Hence, it cannot be changed into another length value without
    // breaking all the bounds and overflow checks that assume this.
    static constexpr unsigned MaxLength = std::numeric_limits<int32_t>::max();
    static_assert(MaxLength == String::MaxLength);

    static constexpr uintptr_t isRopeInPointer = 0x1;

    static constexpr unsigned maxLengthForOnStackResolve = 2048;

private:
    String& uninitializedValueInternal() const
    {
        return *std::bit_cast<String*>(&m_fiber);
    }

    String& valueInternal() const
    {
        ASSERT(!isRope());
        return uninitializedValueInternal();
    }

    static constexpr TypeInfo defaultTypeInfo() { return TypeInfo(StringType, StructureFlags); }
    static constexpr int32_t defaultTypeInfoBlob()
    {
        return TypeInfoBlob::typeInfoBlob(NonArray, defaultTypeInfo().type(), defaultTypeInfo().inlineTypeFlags());
    }

    JSString(VM& vm, Ref<StringImpl>&& value)
        : JSCell(CreatingWellDefinedBuiltinCell, vm.stringStructure.get()->id(), defaultTypeInfoBlob())
    {
        new (&uninitializedValueInternal()) String(WTFMove(value));
    }

    JSString(VM& vm)
        : JSCell(CreatingWellDefinedBuiltinCell, vm.stringStructure.get()->id(), defaultTypeInfoBlob())
        , m_fiber(isRopeInPointer)
    {
    }

    void finishCreation(VM& vm, unsigned length)
    {
        ASSERT_UNUSED(length, length > 0);
        ASSERT(!valueInternal().isNull());
        Base::finishCreation(vm);
    }

    void finishCreation(VM& vm, unsigned length, size_t cost)
    {
        ASSERT_UNUSED(length, length > 0);
        ASSERT(!valueInternal().isNull());
        Base::finishCreation(vm);
        vm.heap.reportExtraMemoryAllocated(this, cost);
    }

    void finishCreation(VM& vm, GCDeferralContext* deferralContext, unsigned length, size_t cost)
    {
        ASSERT_UNUSED(length, length > 0);
        ASSERT(!valueInternal().isNull());
        Base::finishCreation(vm);
        vm.heap.reportExtraMemoryAllocated(deferralContext, this, cost);
    }

    static JSString* createEmptyString(VM&);

    static JSString* create(VM& vm, Ref<StringImpl>&& value)
    {
        unsigned length = value->length();
        ASSERT(length > 0);
        size_t cost = value->cost();
        JSString* newString = new (NotNull, allocateCell<JSString>(vm)) JSString(vm, WTFMove(value));
        newString->finishCreation(vm, length, cost);
        return newString;
    }

    static JSString* create(VM& vm, GCDeferralContext* deferralContext, Ref<StringImpl>&& value)
    {
        unsigned length = value->length();
        ASSERT(length > 0);
        size_t cost = value->cost();
        JSString* newString = new (NotNull, allocateCell<JSString>(vm, deferralContext)) JSString(vm, WTFMove(value));
        newString->finishCreation(vm, deferralContext, length, cost);
        return newString;
    }
    static JSString* createHasOtherOwner(VM& vm, Ref<StringImpl>&& value)
    {
        unsigned length = value->length();
        JSString* newString = new (NotNull, allocateCell<JSString>(vm)) JSString(vm, WTFMove(value));
        newString->finishCreation(vm, length);
        return newString;
    }

protected:
    DECLARE_DEFAULT_FINISH_CREATION;

public:
    Identifier toIdentifier(JSGlobalObject*) const;
    AtomString toAtomString(JSGlobalObject*) const;
    AtomString toExistingAtomString(JSGlobalObject*) const;

    GCOwnedDataScope<StringView> view(JSGlobalObject*) const;

    ALWAYS_INLINE bool equalInline(JSGlobalObject*, JSString* other) const;
    inline bool equal(JSGlobalObject*, JSString* other) const;
    GCOwnedDataScope<const String&> value(JSGlobalObject*) const;
    inline GCOwnedDataScope<const String&> tryGetValue(bool allocationAllowed = true) const;
    GCOwnedDataScope<const String&> tryGetValueWithoutGC() const;
    const StringImpl* getValueImpl() const;
    const StringImpl* tryGetValueImpl() const;
    ALWAYS_INLINE unsigned length() const;

    JSValue toPrimitive(JSGlobalObject*, PreferredPrimitiveType) const;
    bool toBoolean() const { return !!length(); }
    JSObject* toObject(JSGlobalObject*) const;
    double toNumber(JSGlobalObject*) const;

    bool getStringPropertySlot(JSGlobalObject*, PropertyName, PropertySlot&);
    bool getStringPropertySlot(JSGlobalObject*, unsigned propertyName, PropertySlot&);
    bool getStringPropertyDescriptor(JSGlobalObject*, PropertyName, PropertyDescriptor&);

    bool canGetIndex(unsigned i) { return i < length(); }
    JSString* getIndex(JSGlobalObject*, unsigned);

    static Structure* createStructure(VM&, JSGlobalObject*, JSValue);

    static constexpr ptrdiff_t offsetOfValue() { return OBJECT_OFFSETOF(JSString, m_fiber); }

    DECLARE_EXPORT_INFO;

    static void dumpToStream(const JSCell*, PrintStream&);
    static size_t estimatedSize(JSCell*, VM&);
    DECLARE_VISIT_CHILDREN;

    ALWAYS_INLINE bool isRope() const
    {
        return m_fiber & isRopeInPointer;
    }
    ALWAYS_INLINE JSRopeString* asRope()
    {
        ASSERT(isRope());
        return jsCast<JSRopeString*>(this);
    }

    ALWAYS_INLINE bool isNonSubstringRope() const
    {
        return isRope() && !isSubstring();
    }

    bool is8Bit() const;

    ALWAYS_INLINE JSString* tryReplaceOneChar(JSGlobalObject*, UChar, JSString* replacement);

    bool isSubstring() const;
protected:
    friend class JSValue;
    friend class JSCell;

    JS_EXPORT_PRIVATE bool equalSlowCase(JSGlobalObject*, JSString* other) const;

    inline JSString* tryReplaceOneCharImpl(JSGlobalObject*, UChar search, JSString* replacement, uint8_t* stackLimit, bool& found);

    uintptr_t fiberConcurrently() const { return m_fiber; }

    mutable uintptr_t m_fiber;

private:
    friend class LLIntOffsetsExtractor;

    void swapToAtomString(VM&, RefPtr<AtomStringImpl>&&) const;

    friend JSString* jsString(VM&, const String&);
    friend JSString* jsString(VM&, String&&);
    friend JSString* jsString(VM&, StringView);
    friend JSString* jsString(JSGlobalObject*, JSString*, JSString*);
    friend JSString* jsString(JSGlobalObject*, const String&, JSString*);
    friend JSString* jsString(JSGlobalObject*, JSString*, const String&);
    friend JSString* jsString(JSGlobalObject*, const String&, const String&);
    friend JSString* jsString(JSGlobalObject*, JSString*, JSString*, JSString*);
    friend JSString* jsString(JSGlobalObject*, const String&, const String&, const String&);
    friend JS_EXPORT_PRIVATE JSString* jsStringWithCacheSlowCase(VM&, StringImpl&);
    friend JSString* jsSingleCharacterString(VM&, UChar);
    friend JSString* jsSingleCharacterString(VM&, LChar);
    friend JSString* jsNontrivialString(VM&, const String&);
    friend JSString* jsNontrivialString(VM&, String&&);
    friend JSString* jsSubstring(VM&, const String&, unsigned, unsigned);
    friend JSString* jsSubstring(VM&, JSGlobalObject*, JSString*, unsigned, unsigned);
    friend JSString* jsSubstringOfResolved(VM&, GCDeferralContext*, JSString*, unsigned, unsigned);
    friend JSString* jsOwnedString(VM&, const String&);
    friend JSString* jsAtomString(JSGlobalObject*, VM&, JSString*);
    friend JSString* jsAtomString(JSGlobalObject*, VM&, JSString*, JSString*);
    friend JSString* jsAtomString(JSGlobalObject*, VM&, JSString*, JSString*, JSString*);
};

// NOTE: This class cannot override JSString's destructor. JSString's destructor is called directly
// from JSStringSubspace::
class JSRopeString final : public JSString {
    friend class JSString;
    friend class RegExpObject;
    friend class RegExpSubstringGlobalAtomCache;
public:
    static void destroy(JSCell*);

    template<typename, SubspaceAccess>
    static GCClient::IsoSubspace* subspaceFor(VM& vm)
    {
        return &vm.ropeStringSpace();
    }

    // We use lower 3bits of fiber0 for flags. These bits are usable due to alignment, and it is OK even in 32bit architecture.
    static constexpr uintptr_t is8BitInPointer = static_cast<uintptr_t>(StringImpl::flagIs8Bit());
    static constexpr uintptr_t isSubstringInPointer = 0x2;
    static_assert(is8BitInPointer == 0b100);
    static_assert(isSubstringInPointer == 0b010);
    static_assert(isRopeInPointer == 0b001);
    static constexpr uintptr_t stringMask = ~(isRopeInPointer | is8BitInPointer | isSubstringInPointer);
#if CPU(ADDRESS64)
    static_assert(sizeof(uintptr_t) == sizeof(uint64_t));
    class CompactFibers {
    public:
        static constexpr uintptr_t addressMask = (1ULL << OS_CONSTANT(EFFECTIVE_ADDRESS_WIDTH)) - 1;
        JSString* fiber1() const
        {
#if CPU(LITTLE_ENDIAN)
            return std::bit_cast<JSString*>(WTF::unalignedLoad<uintptr_t>(&m_fiber1Lower) & addressMask);
#else
            return std::bit_cast<JSString*>(static_cast<uintptr_t>(m_fiber1Lower) | (static_cast<uintptr_t>(m_fiber1Upper) << 32));
#endif
        }

        void initializeFiber1(JSString* fiber)
        {
            uintptr_t pointer = std::bit_cast<uintptr_t>(fiber);
            m_fiber1Lower = static_cast<uint32_t>(pointer);
            m_fiber1Upper = static_cast<uint16_t>(pointer >> 32);
        }

        JSString* fiber2() const
        {
#if CPU(LITTLE_ENDIAN)
            return std::bit_cast<JSString*>(WTF::unalignedLoad<uintptr_t>(&m_fiber1Upper) >> 16);
#else
            return std::bit_cast<JSString*>(static_cast<uintptr_t>(m_fiber2Lower) | (static_cast<uintptr_t>(m_fiber2Upper) << 16));
#endif
        }
        void initializeFiber2(JSString* fiber)
        {
            uintptr_t pointer = std::bit_cast<uintptr_t>(fiber);
            m_fiber2Lower = static_cast<uint16_t>(pointer);
            m_fiber2Upper = static_cast<uint32_t>(pointer >> 16);
        }

        unsigned length() const { return m_length; }
        void initializeLength(unsigned length)
        {
            m_length = length;
        }

        static constexpr ptrdiff_t offsetOfLength() { return OBJECT_OFFSETOF(CompactFibers, m_length); }
        static constexpr ptrdiff_t offsetOfFiber1() { return OBJECT_OFFSETOF(CompactFibers, m_length); }
        static constexpr ptrdiff_t offsetOfFiber2() { return OBJECT_OFFSETOF(CompactFibers, m_fiber1Upper); }

    private:
        friend class LLIntOffsetsExtractor;

        uint32_t m_length { 0 };
        uint32_t m_fiber1Lower { 0 };
        uint16_t m_fiber1Upper { 0 };
        uint16_t m_fiber2Lower { 0 };
        uint32_t m_fiber2Upper { 0 };
    };
    static_assert(sizeof(CompactFibers) == sizeof(void*) * 2);
#else
    class CompactFibers {
    public:
        JSString* fiber1() const
        {
            return m_fiber1;
        }
        void initializeFiber1(JSString* fiber)
        {
            m_fiber1 = fiber;
        }

        JSString* fiber2() const
        {
            return m_fiber2;
        }
        void initializeFiber2(JSString* fiber)
        {
            m_fiber2 = fiber;
        }

        unsigned length() const { return m_length; }
        void initializeLength(unsigned length)
        {
            m_length = length;
        }

        static constexpr ptrdiff_t offsetOfLength() { return OBJECT_OFFSETOF(CompactFibers, m_length); }
        static constexpr ptrdiff_t offsetOfFiber1() { return OBJECT_OFFSETOF(CompactFibers, m_fiber1); }
        static constexpr ptrdiff_t offsetOfFiber2() { return OBJECT_OFFSETOF(CompactFibers, m_fiber2); }

    private:
        friend class LLIntOffsetsExtractor;

        uint32_t m_length { 0 };
        JSString* m_fiber1 { nullptr };
        JSString* m_fiber2 { nullptr };
    };
#endif

    template <class OverflowHandler = CrashOnOverflow>
    class RopeBuilder : public OverflowHandler {
        WTF_FORBID_HEAP_ALLOCATION;
    public:
        RopeBuilder(VM& vm)
            : m_vm(vm)
        {
        }

        bool append(JSString* jsString)
        {
            if (UNLIKELY(this->hasOverflowed()))
                return false;
            if (!jsString->length())
                return true;
            if (m_strings.size() == JSRopeString::s_maxInternalRopeLength)
                expand();

            static_assert(JSString::MaxLength == std::numeric_limits<int32_t>::max());
            auto sum = checkedSum<int32_t>(m_length, jsString->length());
            if (sum.hasOverflowed()) {
                this->overflowed();
                return false;
            }
            ASSERT(static_cast<unsigned>(sum) <= MaxLength);
            m_strings.append(jsString);
            m_length = static_cast<unsigned>(sum);
            return true;
        }

        JSString* release()
        {
            RELEASE_ASSERT(!this->hasOverflowed());
            JSString* result = nullptr;
            switch (m_strings.size()) {
            case 0: {
                ASSERT(!m_length);
                result = jsEmptyString(m_vm);
                break;
            }
            case 1: {
                result = asString(m_strings.at(0));
                break;
            }
            case 2: {
                result = JSRopeString::create(m_vm, asString(m_strings.at(0)), asString(m_strings.at(1)));
                break;
            }
            case 3: {
                result = JSRopeString::create(m_vm, asString(m_strings.at(0)), asString(m_strings.at(1)), asString(m_strings.at(2)));
                break;
            }
            default:
                ASSERT_NOT_REACHED();
                break;
            }
            ASSERT(result->length() == m_length);
            m_strings.clear();
            m_length = 0;
            return result;
        }

        unsigned length() const
        {
            ASSERT(!this->hasOverflowed());
            return m_length;
        }

    private:
        void expand();

        VM& m_vm;
        MarkedArgumentBuffer m_strings;
        unsigned m_length { 0 };
    };

    inline unsigned length() const
    {
        return m_compactFibers.length();
    }

private:
    friend class LLIntOffsetsExtractor;

    void convertToNonRope(String&&) const;

    void initializeIs8Bit(bool flag) const
    {
        if (flag)
            m_fiber |= is8BitInPointer;
        else
            m_fiber &= ~is8BitInPointer;
    }

    void initializeIsSubstring(bool flag) const
    {
        if (flag)
            m_fiber |= isSubstringInPointer;
        else
            m_fiber &= ~isSubstringInPointer;
    }

    ALWAYS_INLINE void initializeLength(unsigned length)
    {
        ASSERT(length <= MaxLength);
        m_compactFibers.initializeLength(length);
    }

    JSRopeString(VM& vm)
        : JSString(vm)
    {
        initializeIsSubstring(false);
        initializeLength(0);
        initializeIs8Bit(true);
        initializeFiber0(nullptr);
        initializeFiber1(nullptr);
        initializeFiber2(nullptr);
    }

    JSRopeString(VM& vm, unsigned length, bool is8Bit, JSString* s1, JSString* s2)
        : JSString(vm)
    {
        ASSERT(!sumOverflows<int32_t>(s1->length(), s2->length()));
        initializeIsSubstring(false);
        initializeLength(length);
        initializeIs8Bit(is8Bit);
        initializeFiber0(s1);
        initializeFiber1(s2);
        initializeFiber2(nullptr);
        ASSERT((s1->length() + s2->length()) == this->length());
    }

    JSRopeString(VM& vm, unsigned length, bool is8Bit, JSString* s1, JSString* s2, JSString* s3)
        : JSString(vm)
    {
        ASSERT(!sumOverflows<int32_t>(s1->length(), s2->length(), s3->length()));
        initializeIsSubstring(false);
        initializeLength(length);
        initializeIs8Bit(is8Bit);
        initializeFiber0(s1);
        initializeFiber1(s2);
        initializeFiber2(s3);
        ASSERT((s1->length() + s2->length() + s3->length()) == this->length());
    }

    JSRopeString(VM& vm, unsigned length, bool is8Bit, JSString* base, unsigned offset)
        : JSString(vm)
    {
        ASSERT(!sumOverflows<int32_t>(offset, length));
        ASSERT(offset + length <= base->length());
        initializeIsSubstring(true);
        initializeLength(length);
        initializeIs8Bit(is8Bit);
        initializeSubstringBase(base);
        initializeSubstringOffset(offset);
        ASSERT(length == this->length());
        ASSERT(!base->isRope());
    }

    ALWAYS_INLINE void finishCreationSubstringOfResolved(VM& vm)
    {
        Base::finishCreation(vm);
    }

public:
    static constexpr ptrdiff_t offsetOfLength() { return OBJECT_OFFSETOF(JSRopeString, m_compactFibers) + CompactFibers::offsetOfLength(); } // 32byte width.
    static constexpr ptrdiff_t offsetOfFlags() { return offsetOfValue(); }
    static constexpr ptrdiff_t offsetOfFiber0() { return offsetOfValue(); }
    static constexpr ptrdiff_t offsetOfFiber1() { return OBJECT_OFFSETOF(JSRopeString, m_compactFibers) + CompactFibers::offsetOfFiber1(); }
    static constexpr ptrdiff_t offsetOfFiber2() { return OBJECT_OFFSETOF(JSRopeString, m_compactFibers) + CompactFibers::offsetOfFiber2(); }

    static constexpr unsigned s_maxInternalRopeLength = 3;

    // If nullOrExecForOOM is null, resolveRope() will be do nothing in the event of an OOM error.
    // The rope value will remain a null string in that case.
    JS_EXPORT_PRIVATE const String& resolveRope(JSGlobalObject* nullOrGlobalObjectForOOM) const;
    JS_EXPORT_PRIVATE const String& resolveRopeWithoutGC() const;

    template<typename CharacterType>
    static void resolveToBuffer(JSString*, JSString*, JSString*, std::span<CharacterType> buffer);

private:
    template<typename CharacterType>
    static void resolveToBufferSlow(JSString*, JSString*, JSString*, std::span<CharacterType> buffer);

    static JSRopeString* create(VM& vm, JSString* s1, JSString* s2)
    {
        unsigned length = s1->length() + s2->length();
        bool is8Bit = !!(static_cast<unsigned>(!!s1->is8Bit()) & static_cast<unsigned>(!!s2->is8Bit()));
        JSRopeString* newString = new (NotNull, allocateCell<JSRopeString>(vm)) JSRopeString(vm, length, is8Bit, s1, s2);
        newString->finishCreation(vm);
        ASSERT(newString->length());
        ASSERT(newString->isRope());
        return newString;
    }
    static JSRopeString* create(VM& vm, JSString* s1, JSString* s2, JSString* s3)
    {
        unsigned length = s1->length() + s2->length() + s3->length();
        bool is8Bit = !!(static_cast<unsigned>(!!s1->is8Bit()) & static_cast<unsigned>(!!s2->is8Bit()) & static_cast<unsigned>(!!s3->is8Bit()));
        JSRopeString* newString = new (NotNull, allocateCell<JSRopeString>(vm)) JSRopeString(vm, length, is8Bit, s1, s2, s3);
        newString->finishCreation(vm);
        ASSERT(newString->length());
        ASSERT(newString->isRope());
        return newString;
    }

    ALWAYS_INLINE static JSRopeString* createSubstringOfResolved(VM& vm, GCDeferralContext* deferralContext, JSString* base, unsigned offset, unsigned length, bool is8Bit)
    {
        JSRopeString* newString = new (NotNull, allocateCell<JSRopeString>(vm, deferralContext)) JSRopeString(vm, length, is8Bit, base, offset);
        newString->finishCreationSubstringOfResolved(vm);
        ASSERT(newString->length());
        ASSERT(newString->isRope());
        return newString;
    }

    friend JSValue jsStringFromRegisterArray(JSGlobalObject*, Register*, unsigned);

    template<bool reportAllocation, typename Function> const String& resolveRopeWithFunction(JSGlobalObject* nullOrGlobalObjectForOOM, Function&&) const;
    JS_EXPORT_PRIVATE AtomString resolveRopeToAtomString(JSGlobalObject*) const;
    JS_EXPORT_PRIVATE RefPtr<AtomStringImpl> resolveRopeToExistingAtomString(JSGlobalObject*) const;
    template<typename CharacterType> void resolveRopeInternalNoSubstring(std::span<CharacterType>) const;
    Identifier toIdentifier(JSGlobalObject*) const;
    void outOfMemory(JSGlobalObject* nullOrGlobalObjectForOOM) const;
    GCOwnedDataScope<StringView> view(JSGlobalObject*) const;

    JSString* fiber0() const
    {
        return std::bit_cast<JSString*>(m_fiber & stringMask);
    }

    JSString* fiber1() const
    {
        return m_compactFibers.fiber1();
    }

    JSString* fiber2() const
    {
        return m_compactFibers.fiber2();
    }

    JSString* fiber(unsigned i) const
    {
        ASSERT(!isSubstring());
        ASSERT(i < s_maxInternalRopeLength);
        switch (i) {
        case 0:
            return fiber0();
        case 1:
            return fiber1();
        case 2:
            return fiber2();
        }
        ASSERT_NOT_REACHED();
        return nullptr;
    }

    void initializeFiber0(JSString* fiber)
    {
        uintptr_t pointer = std::bit_cast<uintptr_t>(fiber);
        ASSERT(!(pointer & ~stringMask));
        m_fiber = (pointer | (m_fiber & ~stringMask));
    }

    void initializeFiber1(JSString* fiber)
    {
        m_compactFibers.initializeFiber1(fiber);
    }

    void initializeFiber2(JSString* fiber)
    {
        m_compactFibers.initializeFiber2(fiber);
    }

    void initializeSubstringBase(JSString* fiber)
    {
        initializeFiber1(fiber);
    }

    JSString* substringBase() const { return fiber1(); }

    void initializeSubstringOffset(unsigned offset)
    {
        m_compactFibers.initializeFiber2(std::bit_cast<JSString*>(static_cast<uintptr_t>(offset)));
    }

    unsigned substringOffset() const
    {
        return static_cast<unsigned>(std::bit_cast<uintptr_t>(fiber2()));
    }

    static_assert(s_maxInternalRopeLength >= 2);
    mutable CompactFibers m_compactFibers;

    friend JSString* jsString(JSGlobalObject*, JSString*, JSString*);
    friend JSString* jsString(JSGlobalObject*, const String&, JSString*);
    friend JSString* jsString(JSGlobalObject*, JSString*, const String&);
    friend JSString* jsString(JSGlobalObject*, const String&, const String&);
    friend JSString* jsString(JSGlobalObject*, JSString*, JSString*, JSString*);
    friend JSString* jsString(JSGlobalObject*, const String&, const String&, const String&);
    friend JSString* jsSubstringOfResolved(VM&, GCDeferralContext*, JSString*, unsigned, unsigned);
    friend JSString* jsSubstring(VM&, JSGlobalObject*, JSString*, unsigned, unsigned);
    friend JSString* jsAtomString(JSGlobalObject*, VM&, JSString*);
    friend JSString* jsAtomString(JSGlobalObject*, VM&, JSString*, JSString*);
    friend JSString* jsAtomString(JSGlobalObject*, VM&, JSString*, JSString*, JSString*);
};

JS_EXPORT_PRIVATE JSString* jsStringWithCacheSlowCase(VM&, StringImpl&);

// JSString::is8Bit is safe to be called concurrently. Concurrent threads can access is8Bit even if the main thread
// is in the middle of converting JSRopeString to JSString.
ALWAYS_INLINE bool JSString::is8Bit() const
{
    uintptr_t pointer = fiberConcurrently();
    if (pointer & isRopeInPointer) {
        // Do not load m_fiber twice. We should use the information in pointer.
        // Otherwise, JSRopeString may be converted to JSString between the first and second accesses.
        return pointer & JSRopeString::is8BitInPointer;
    }
    return std::bit_cast<StringImpl*>(pointer)->is8Bit();
}

// JSString::length is safe to be called concurrently. Concurrent threads can access length even if the main thread
// is in the middle of converting JSRopeString to JSString. This is OK because we never override the length bits
// when we resolve a JSRopeString.
ALWAYS_INLINE unsigned JSString::length() const
{
    uintptr_t pointer = fiberConcurrently();
    if (pointer & isRopeInPointer)
        return jsCast<const JSRopeString*>(this)->length();
    return std::bit_cast<StringImpl*>(pointer)->length();
}

inline const StringImpl* JSString::getValueImpl() const
{
    ASSERT(!isRope());
    return std::bit_cast<StringImpl*>(m_fiber);
}

inline const StringImpl* JSString::tryGetValueImpl() const
{
    uintptr_t pointer = fiberConcurrently();
    if (pointer & isRopeInPointer)
        return nullptr;
    return std::bit_cast<StringImpl*>(pointer);
}

inline JSString* asString(JSValue value)
{
    ASSERT(value.asCell()->isString());
    return jsCast<JSString*>(value.asCell());
}

// This MUST NOT GC.
inline JSString* jsEmptyString(VM& vm)
{
    return vm.smallStrings.emptyString();
}

ALWAYS_INLINE JSString* jsSingleCharacterString(VM& vm, UChar c)
{
    if constexpr (validateDFGDoesGC)
        vm.verifyCanGC();
    if (c <= maxSingleCharacterString)
        return vm.smallStrings.singleCharacterString(c);
    return JSString::create(vm, StringImpl::create(std::span { &c, 1 }));
}

ALWAYS_INLINE JSString* jsSingleCharacterString(VM& vm, LChar c)
{
    if constexpr (validateDFGDoesGC)
        vm.verifyCanGC();
    ASSERT(maxSingleCharacterString >= 0xff);
    return vm.smallStrings.singleCharacterString(c);
}

inline JSString* jsNontrivialString(VM& vm, const String& s)
{
    ASSERT(s.length() > 1);
    return JSString::create(vm, *s.impl());
}

inline JSString* jsNontrivialString(VM& vm, String&& s)
{
    ASSERT(s.length() > 1);
    return JSString::create(vm, s.releaseImpl().releaseNonNull());
}

ALWAYS_INLINE Identifier JSRopeString::toIdentifier(JSGlobalObject* globalObject) const
{
    VM& vm = getVM(globalObject);
    auto scope = DECLARE_THROW_SCOPE(vm);
    auto atomString = static_cast<const JSRopeString*>(this)->resolveRopeToAtomString(globalObject);
    RETURN_IF_EXCEPTION(scope, { });
    return Identifier::fromString(vm, atomString);
}

ALWAYS_INLINE void JSString::swapToAtomString(VM& vm, RefPtr<AtomStringImpl>&& atom) const
{
    // We replace currently held string with new AtomString. But the old string can be accessed from concurrent compilers and GC threads at any time.
    // So, we keep the old string alive by appending it to Heap::m_possiblyAccessedStringsFromConcurrentThreads. And GC clears that list when GC finishes.
    // This is OK since (1) when finishing GC concurrent compiler threads and GC threads are stopped, and (2) AtomString is already held in the atom table,
    // and we anyway keep this old string until this JSString* is GC-ed. So it does not increase any memory pressure, we release at the same timing.
    ASSERT(!isCompilationThread() && !Thread::mayBeGCThread());
    String target(WTFMove(atom));
    WTF::storeStoreFence(); // Ensure AtomStringImpl's string is fully initialized when it is exposed to concurrent threads.
    valueInternal().swap(target);
    vm.heap.appendPossiblyAccessedStringFromConcurrentThreads(WTFMove(target));
}

ALWAYS_INLINE Identifier JSString::toIdentifier(JSGlobalObject* globalObject) const
{
    if constexpr (validateDFGDoesGC)
        vm().verifyCanGC();
    if (isRope())
        return static_cast<const JSRopeString*>(this)->toIdentifier(globalObject);
    VM& vm = getVM(globalObject);
    if (valueInternal().impl()->isAtom())
        return Identifier::fromString(vm, Ref { *static_cast<AtomStringImpl*>(valueInternal().impl()) });
    if (vm.lastAtomizedIdentifierStringImpl.ptr() != valueInternal().impl()) {
        vm.lastAtomizedIdentifierStringImpl = *valueInternal().impl();
        vm.lastAtomizedIdentifierAtomStringImpl = AtomStringImpl::add(valueInternal().impl()).releaseNonNull();
    }
    // It is possible that AtomStringImpl::add converts existing valueInternal()'s StringImpl to AtomicStringImpl,
    // thus we need to recheck atomicity status here.
    if (!valueInternal().impl()->isAtom())
        swapToAtomString(vm, RefPtr { vm.lastAtomizedIdentifierAtomStringImpl.ptr() });
    return Identifier::fromString(vm, Ref { vm.lastAtomizedIdentifierAtomStringImpl });
}

ALWAYS_INLINE AtomString JSString::toAtomString(JSGlobalObject* globalObject) const
{
    if constexpr (validateDFGDoesGC)
        vm().verifyCanGC();
    if (isRope())
        return static_cast<const JSRopeString*>(this)->resolveRopeToAtomString(globalObject);
    AtomString atom(valueInternal());
    // It is possible that AtomString constructor converts existing valueInternal()'s StringImpl to AtomicStringImpl,
    // thus we need to recheck atomicity status here.
    if (!valueInternal().impl()->isAtom())
        swapToAtomString(getVM(globalObject), RefPtr { atom.impl() });
    return atom;
}

ALWAYS_INLINE AtomString JSString::toExistingAtomString(JSGlobalObject* globalObject) const
{
    if constexpr (validateDFGDoesGC)
        vm().verifyCanGC();
    if (isRope())
        return static_cast<const JSRopeString*>(this)->resolveRopeToExistingAtomString(globalObject);
    if (valueInternal().impl()->isAtom())
        return static_cast<AtomStringImpl*>(valueInternal().impl());
    return AtomStringImpl::lookUp(valueInternal().impl());
}

inline GCOwnedDataScope<const String&> JSString::value(JSGlobalObject* globalObject) const
{
    if constexpr (validateDFGDoesGC)
        vm().verifyCanGC();
    if (isRope())
        return { this, static_cast<const JSRopeString*>(this)->resolveRope(globalObject) };
    return { this, valueInternal() };
}

inline GCOwnedDataScope<const String&> JSString::tryGetValue(bool allocationAllowed) const
{
    if (allocationAllowed) {
        if constexpr (validateDFGDoesGC)
            vm().verifyCanGC();
        if (isRope()) {
            // Pass nullptr for the JSGlobalObject so that resolveRope does not throw in the event of an OOM error.
            return { this, static_cast<const JSRopeString*>(this)->resolveRope(nullptr) };
        }
    } else
        RELEASE_ASSERT(!isRope());
    return { this, valueInternal() };
}

inline JSString* JSString::getIndex(JSGlobalObject* globalObject, unsigned i)
{
    VM& vm = getVM(globalObject);
    auto scope = DECLARE_THROW_SCOPE(vm);
    ASSERT(canGetIndex(i));
    auto view = this->view(globalObject);
    RETURN_IF_EXCEPTION(scope, nullptr);
    return jsSingleCharacterString(vm, view[i]);
}

inline JSString* jsString(VM& vm, const String& s)
{
    int size = s.length();
    if (!size)
        return vm.smallStrings.emptyString();
    if (size == 1) {
        if (auto c = s.characterAt(0); c <= maxSingleCharacterString)
            return vm.smallStrings.singleCharacterString(c);
    }
    return JSString::create(vm, *s.impl());
}

inline JSString* jsString(VM& vm, String&& s)
{
    int size = s.length();
    if (!size)
        return vm.smallStrings.emptyString();
    if (size == 1) {
        if (auto c = s.characterAt(0); c <= maxSingleCharacterString)
            return vm.smallStrings.singleCharacterString(c);
    }
    return JSString::create(vm, s.releaseImpl().releaseNonNull());
}

ALWAYS_INLINE JSString* jsString(VM& vm, const AtomString& s)
{
    return jsString(vm, s.string());
}

ALWAYS_INLINE JSString* jsString(VM& vm, AtomString&& s)
{
    return jsString(vm, s.releaseString());
}

inline JSString* jsString(VM& vm, StringView s)
{
    int size = s.length();
    if (!size)
        return vm.smallStrings.emptyString();
    if (size == 1) {
        if (auto c = s.characterAt(0); c <= maxSingleCharacterString)
            return vm.smallStrings.singleCharacterString(c);
    }
    auto impl = s.is8Bit() ? StringImpl::create(s.span8()) : StringImpl::create(s.span16());
    return JSString::create(vm, WTFMove(impl));
}

ALWAYS_INLINE JSString* jsString(VM& vm, RefPtr<AtomStringImpl>&& s)
{
    return jsString(vm, String { WTFMove(s) });
}

ALWAYS_INLINE JSString* jsString(VM& vm, Ref<AtomStringImpl>&& s)
{
    return jsString(vm, String { WTFMove(s) });
}

ALWAYS_INLINE JSString* jsString(VM& vm, Ref<StringImpl>&& s)
{
    return jsString(vm, String { WTFMove(s) });
}

inline JSString* jsSubstring(VM& vm, JSGlobalObject* globalObject, JSString* base, unsigned offset, unsigned length)
{
    ASSERT(offset <= base->length());
    ASSERT(length <= base->length());
    ASSERT(offset + length <= base->length());
    if (!length)
        return vm.smallStrings.emptyString();
    if (!offset && length == base->length())
        return base;

    // For now, let's not allow substrings with a rope base.
    // Resolve non-substring rope bases so we don't have to deal with it.
    // FIXME: Evaluate if this would be worth adding more branches.
    if (base->isSubstring()) {
        JSRopeString* baseRope = jsCast<JSRopeString*>(base);
        ASSERT(!baseRope->substringBase()->isRope());
        return jsSubstringOfResolved(vm, nullptr, baseRope->substringBase(), baseRope->substringOffset() + offset, length);
    }

    if (!base->isRope())
        return jsSubstringOfResolved(vm, nullptr, base, offset, length);

    auto* rope = jsCast<JSRopeString*>(base);
    auto* fiber0 = rope->fiber0();
    ASSERT(fiber0);
    if (offset < fiber0->length()) {
        if ((offset + length) <= fiber0->length())
            MUST_TAIL_CALL return jsSubstring(vm, globalObject, fiber0, offset, length);
        // Crossing multiple fibers. Giving up and resolving the rope.
    } else {
        unsigned adjustedOffset = offset - fiber0->length();
        auto* fiber1 = rope->fiber1();
        ASSERT(fiber1);
        if (adjustedOffset < fiber1->length()) {
            if ((adjustedOffset + length) <= fiber1->length())
                MUST_TAIL_CALL return jsSubstring(vm, globalObject, fiber1, adjustedOffset, length);
            // Crossing multiple fibers. Giving up and resolving the rope.
        } else {
            adjustedOffset -= fiber1->length();
            auto* fiber2 = rope->fiber2();
            ASSERT(fiber2);
            ASSERT(adjustedOffset < fiber2->length());
            ASSERT((adjustedOffset + length) <= fiber2->length());
            MUST_TAIL_CALL return jsSubstring(vm, globalObject, fiber2, adjustedOffset, length);
        }
    }

    auto scope = DECLARE_THROW_SCOPE(vm);
    rope->resolveRope(globalObject);
    RETURN_IF_EXCEPTION(scope, nullptr);
    return jsSubstringOfResolved(vm, nullptr, base, offset, length);
}

inline JSString* jsSubstringOfResolved(VM& vm, JSString* s, unsigned offset, unsigned length)
{
    return jsSubstringOfResolved(vm, nullptr, s, offset, length);
}

inline JSString* jsSubstring(JSGlobalObject* globalObject, JSString* s, unsigned offset, unsigned length)
{
    return jsSubstring(getVM(globalObject), globalObject, s, offset, length);
}

inline JSString* jsSubstring(VM& vm, const String& s, unsigned offset, unsigned length)
{
    ASSERT(offset <= s.length());
    ASSERT(length <= s.length());
    ASSERT(offset + length <= s.length());
    if (!length)
        return vm.smallStrings.emptyString();
    if (length == 1) {
        if (auto c = s.characterAt(offset); c <= maxSingleCharacterString)
            return vm.smallStrings.singleCharacterString(c);
    }
    auto impl = StringImpl::createSubstringSharingImpl(*s.impl(), offset, length);
    if (impl->isSubString())
        return JSString::createHasOtherOwner(vm, WTFMove(impl));
    return JSString::create(vm, WTFMove(impl));
}

inline JSString* jsOwnedString(VM& vm, const String& s)
{
    int size = s.length();
    if (!size)
        return vm.smallStrings.emptyString();
    if (size == 1) {
        if (auto c = s.characterAt(0); c <= maxSingleCharacterString)
            return vm.smallStrings.singleCharacterString(c);
    }
    return JSString::createHasOtherOwner(vm, *s.impl());
}

ALWAYS_INLINE JSString* jsStringWithCache(VM& vm, const String& s)
{
    unsigned length = s.length();
    if (!length)
        return jsEmptyString(vm);

    auto& stringImpl = *s.impl();
    if (length == 1) {
        if (auto c = stringImpl[0]; c <= maxSingleCharacterString)
            return vm.smallStrings.singleCharacterString(c);
    }

    if (auto* lastCachedString = vm.lastCachedString.get()) {
        if (lastCachedString->getValueImpl() == &stringImpl)
            return lastCachedString;
    }

    return jsStringWithCacheSlowCase(vm, stringImpl);
}

ALWAYS_INLINE bool JSString::getStringPropertySlot(JSGlobalObject* globalObject, PropertyName propertyName, PropertySlot& slot)
{
    VM& vm = getVM(globalObject);
    auto scope = DECLARE_THROW_SCOPE(vm);

    if (propertyName == vm.propertyNames->length) {
        slot.setValue(this, PropertyAttribute::DontEnum | PropertyAttribute::DontDelete | PropertyAttribute::ReadOnly, jsNumber(length()));
        return true;
    }

    std::optional<uint32_t> index = parseIndex(propertyName);
    if (index && index.value() < length()) {
        JSValue value = getIndex(globalObject, index.value());
        RETURN_IF_EXCEPTION(scope, false);
        slot.setValue(this, PropertyAttribute::DontDelete | PropertyAttribute::ReadOnly, value);
        return true;
    }

    return false;
}

ALWAYS_INLINE bool JSString::getStringPropertySlot(JSGlobalObject* globalObject, unsigned propertyName, PropertySlot& slot)
{
    VM& vm = getVM(globalObject);
    auto scope = DECLARE_THROW_SCOPE(vm);

    if (propertyName < length()) {
        JSValue value = getIndex(globalObject, propertyName);
        RETURN_IF_EXCEPTION(scope, false);
        slot.setValue(this, PropertyAttribute::DontDelete | PropertyAttribute::ReadOnly, value);
        return true;
    }

    return false;
}

inline bool isJSString(JSCell* cell)
{
    return cell->type() == StringType;
}

inline bool isJSString(JSValue v)
{
    return v.isCell() && isJSString(v.asCell());
}

ALWAYS_INLINE GCOwnedDataScope<StringView> JSRopeString::view(JSGlobalObject* globalObject) const
{
    if constexpr (validateDFGDoesGC)
        vm().verifyCanGC();
    if (isSubstring()) {
        auto& base = substringBase()->valueInternal();
        // We return the substring as that's the owner and JSStringJoiner will end up retaining a reference to the underlying string.
        return { substringBase(), StringView { base }.substring(substringOffset(), length()) };
    }
    auto& string = resolveRope(globalObject);
    return { this, string };
}

ALWAYS_INLINE GCOwnedDataScope<StringView> JSString::view(JSGlobalObject* globalObject) const
{
    if (isRope())
        return static_cast<const JSRopeString&>(*this).view(globalObject);
    return { this, valueInternal() };
}

inline bool JSString::isSubstring() const
{
    return fiberConcurrently() & JSRopeString::isSubstringInPointer;
}

} // namespace JSC
