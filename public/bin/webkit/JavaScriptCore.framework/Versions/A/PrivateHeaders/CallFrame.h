/*
 *  Copyright (C) 1999-2001 Harri Porten (porten@kde.org)
 *  Copyright (C) 2001 Peter Kelly (pmk@post.com)
 *  Copyright (C) 2003-2024 Apple Inc. All rights reserved.
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

#include "CPU.h"
#include "CalleeBits.h"
#include "MacroAssemblerCodeRef.h"
#include "Register.h"
#include "StackVisitor.h"
#include "VM.h"
#include <wtf/EnumClassOperatorOverloads.h>

#if OS(WINDOWS)
#include <intrin.h>
#endif

WTF_ALLOW_UNSAFE_BUFFER_USAGE_BEGIN

namespace JSC  {

class JSWebAssemblyInstance;

template<typename> struct BaseInstruction;
struct JSOpcodeTraits;
using JSInstruction = BaseInstruction<JSOpcodeTraits>;

    class Arguments;
    class CallFrame;
    class Interpreter;
    class JSCallee;
    class JSScope;
    class SourceOrigin;
    class VirtualRegister;

    class CallSiteIndex {
    public:
        CallSiteIndex() = default;

        CallSiteIndex(WTF::HashTableDeletedValueType)
            : m_bits(deletedValue().bits())
        {
        }
        
        explicit CallSiteIndex(BytecodeIndex bytecodeIndex)
            : m_bits(bytecodeIndex.offset())
        { 
            ASSERT(!bytecodeIndex.checkpoint());
        }
        explicit CallSiteIndex(uint32_t bits)
            : m_bits(bits)
        { }

        explicit operator bool() const { return !!m_bits; }
        friend bool operator==(const CallSiteIndex&, const CallSiteIndex&) = default;

        unsigned hash() const { return intHash(m_bits); }
        static CallSiteIndex deletedValue() { return fromBits(s_invalidIndex - 1); }
        bool isHashTableDeletedValue() const { return *this == deletedValue(); }

        uint32_t bits() const { return m_bits; }
        static CallSiteIndex fromBits(uint32_t bits) { return CallSiteIndex(bits); }

        BytecodeIndex bytecodeIndex() const { return BytecodeIndex(bits()); }

    private:
        static constexpr uint32_t s_invalidIndex = std::numeric_limits<uint32_t>::max();

        uint32_t m_bits { s_invalidIndex };
    };

    struct CallSiteIndexHash {
        static unsigned hash(const CallSiteIndex& key) { return key.hash(); }
        static bool equal(const CallSiteIndex& a, const CallSiteIndex& b) { return a == b; }
        static constexpr bool safeToCompareToEmptyOrDeleted = true;
    };

    class DisposableCallSiteIndex : public CallSiteIndex {
    public:
        DisposableCallSiteIndex() = default;

        explicit DisposableCallSiteIndex(uint32_t bits)
            : CallSiteIndex(bits)
        {
        }

        static DisposableCallSiteIndex fromCallSiteIndex(CallSiteIndex callSiteIndex)
        {
            return DisposableCallSiteIndex(callSiteIndex.bits());
        }
    };

    // arm64_32 expects caller frame and return pc to use 8 bytes 
    struct CallerFrameAndPC {
        alignas(CPURegister) CallFrame* callerFrame;
        alignas(CPURegister) void* returnPC;
        static constexpr int sizeInRegisters = 2 * sizeof(CPURegister) / sizeof(Register);
    };
    static_assert(CallerFrameAndPC::sizeInRegisters == sizeof(CallerFrameAndPC) / sizeof(Register), "CallerFrameAndPC::sizeInRegisters is incorrect.");
    static_assert(sizeof(CallerFrameAndPC) >= prologueStackPointerDelta());
#if !CPU(X86_64)
    // Only x86_64 "call" pushes return address on the stack. Other architecture pushes in the function prologue after the call.
    static_assert(sizeof(CallerFrameAndPC) == prologueStackPointerDelta());
#endif

    //      Layout of CallFrame
    //
    //   |          ......            |   |
    //   +----------------------------+   |
    //   |           argN             |   v  lower address
    //   +----------------------------+
    //   |           arg1             |
    //   +----------------------------+
    //   |           arg0             |
    //   +----------------------------+
    //   |           this             |
    //   +----------------------------+
    //   | argumentCountIncludingThis |
    //   +----------------------------+
    //   |          callee            |
    //   +----------------------------+
    //   |        codeBlock           |
    //   +----------------------------+
    //   |      return-address        |
    //   +----------------------------+
    //   |       callerFrame          |
    //   +----------------------------+  <- callee's cfr is pointing this address
    //   |          local0            |
    //   +----------------------------+
    //   |          local1            |
    //   +----------------------------+
    //   |          localN            |
    //   +----------------------------+
    //   |          ......            |

    enum class CallFrameSlot {
        codeBlock = CallerFrameAndPC::sizeInRegisters,
        callee = codeBlock + 1,
        argumentCountIncludingThis = callee + 1,
        thisArgument = argumentCountIncludingThis + 1,
        firstArgument = thisArgument + 1,
    };

    OVERLOAD_MATH_OPERATORS_FOR_ENUM_CLASS_WITH_INTEGRALS(CallFrameSlot)
    OVERLOAD_RELATIONAL_OPERATORS_FOR_ENUM_CLASS_WITH_INTEGRALS(CallFrameSlot)

    // Represents the current state of script execution.
    // Passed as the first argument to most functions.
    class CallFrame : private Register {
    public:
        static constexpr int headerSizeInRegisters = static_cast<int>(CallFrameSlot::argumentCountIncludingThis) + 1;

        // This function should only be called in very specific circumstances
        // when you've guaranteed the callee can't be a Wasm callee, and can
        // be an arbitrary JSValue. This function should basically never be used.
        // Its only use right now is when we are making a call, and we're not
        // yet sure if the callee is a cell. In general, a JS callee is guaranteed
        // to be a cell, however, there is a brief window where we need to check
        // to see if it's a cell, and if it's not, we throw an exception.
        inline JSValue guaranteedJSValueCallee() const;
        inline JSObject* jsCallee() const;
        CalleeBits callee() const { return CalleeBits(this[static_cast<int>(CallFrameSlot::callee)].unboxedInt64()); }
        SUPPRESS_ASAN CalleeBits unsafeCallee() const { return CalleeBits(this[static_cast<int>(CallFrameSlot::callee)].asanUnsafeUnboxedInt64()); }
        CodeBlock* codeBlock() const;
        CodeBlock** addressOfCodeBlock() const { return std::bit_cast<CodeBlock**>(this + static_cast<int>(CallFrameSlot::codeBlock)); }
        inline SUPPRESS_ASAN CodeBlock* unsafeCodeBlock() const;
        inline JSScope* scope(int scopeRegisterOffset) const;

        // Global object in which the currently executing code was defined.
        // Differs from VM::deprecatedVMEntryGlobalObject() during function calls across web browser frames.
        JSGlobalObject* lexicalGlobalObject(VM&) const;

        // FIXME: Remove this function
        // https://bugs.webkit.org/show_bug.cgi?id=203272
        VM& deprecatedVM() const;

        static CallFrame* create(Register* callFrameBase) { return static_cast<CallFrame*>(callFrameBase); }
        Register* registers() { return this; }
        const Register* registers() const { return this; }

        CallFrame& operator=(const Register& r) { *static_cast<Register*>(this) = r; return *this; }

        CallFrame* callerFrame() const { return static_cast<CallFrame*>(callerFrameOrEntryFrame()); }
        void* callerFrameOrEntryFrame() const { return callerFrameAndPC().callerFrame; }
        SUPPRESS_ASAN void* unsafeCallerFrameOrEntryFrame() const { return unsafeCallerFrameAndPC().callerFrame; }

        CallFrame* unsafeCallerFrame(EntryFrame*&) const;
        JS_EXPORT_PRIVATE CallFrame* callerFrame(EntryFrame*&) const;

        JS_EXPORT_PRIVATE SourceOrigin callerSourceOrigin(VM&);

        static constexpr ptrdiff_t callerFrameOffset() { return OBJECT_OFFSETOF(CallerFrameAndPC, callerFrame); }

        void* rawReturnPCForInspection() const { return callerFrameAndPC().returnPC; }
        void* returnPCForInspection() const { return removeCodePtrTag(callerFrameAndPC().returnPC); }
        bool hasReturnPC() const { return !!callerFrameAndPC().returnPC; }
        void clearReturnPC() { callerFrameAndPC().returnPC = nullptr; }
        static constexpr ptrdiff_t returnPCOffset() { return OBJECT_OFFSETOF(CallerFrameAndPC, returnPC); }

        bool callSiteBitsAreBytecodeOffset() const;
        bool callSiteBitsAreCodeOriginIndex() const;

        unsigned callSiteAsRawBits() const;
        unsigned unsafeCallSiteAsRawBits() const;
        CallSiteIndex callSiteIndex() const;
        CallSiteIndex unsafeCallSiteIndex() const;
        void setCallSiteIndex(CallSiteIndex);

#if ENABLE(WEBASSEMBLY)
        JSWebAssemblyInstance* wasmInstance() const;
#endif

        JSCell* codeOwnerCell() const;

    private:
        unsigned callSiteBitsAsBytecodeOffset() const;
        JS_EXPORT_PRIVATE JSGlobalObject* lexicalGlobalObjectFromNativeCallee(VM&) const;
        JS_EXPORT_PRIVATE JSCell* codeOwnerCellSlow() const;
    public:

        // This will try to get you the bytecode offset, but you should be aware that
        // this bytecode offset may be bogus in the presence of inlining. This will
        // also return 0 if the call frame has no notion of bytecode offsets (for
        // example if it's native code).
        // https://bugs.webkit.org/show_bug.cgi?id=121754
        BytecodeIndex bytecodeIndex() const;
        
        // This will get you a CodeOrigin. It will always succeed. May return
        // CodeOrigin(BytecodeIndex(0)) if we're in native code.
        JS_EXPORT_PRIVATE CodeOrigin codeOrigin() const;

        inline Register* topOfFrame();

        const JSInstruction* currentVPC() const; // This only makes sense in the LLInt and baseline.
        void setCurrentVPC(const JSInstruction*);

        void setCallerFrame(CallFrame* frame) { callerFrameAndPC().callerFrame = frame; }
        inline void setScope(int scopeRegisterOffset, JSScope*);

        // Read a register from the codeframe (or constant from the CodeBlock).
        Register& r(VirtualRegister);
        // Read a register for a known non-constant
        Register& uncheckedR(VirtualRegister);

        // Access to arguments as passed. (After capture, arguments may move to a different location.)
        size_t argumentCount() const { return argumentCountIncludingThis() - 1; }
        size_t argumentCountIncludingThis() const { return this[static_cast<int>(CallFrameSlot::argumentCountIncludingThis)].payload(); }
        static constexpr int argumentOffset(int argument) { return (CallFrameSlot::firstArgument + argument); }
        static constexpr int argumentOffsetIncludingThis(int argument) { return (CallFrameSlot::thisArgument + argument); }

        // In the following (argument() and setArgument()), the 'argument'
        // parameter is the index of the arguments of the target function of
        // this frame. The index starts at 0 for the first arg, 1 for the
        // second, etc.
        //
        // The arguments (in this case) do not include the 'this' value.
        // arguments(0) will not fetch the 'this' value. To get/set 'this',
        // use thisValue() and setThisValue() below.

        JSValue* addressOfArgumentsStart() const { return std::bit_cast<JSValue*>(this + argumentOffset(0)); }
        JSValue argument(size_t argument) const
        {
            if (argument >= argumentCount())
                 return jsUndefined();
            return getArgumentUnsafe(argument);
        }
        JSValue uncheckedArgument(size_t argument) const
        {
            ASSERT(argument < argumentCount());
            return getArgumentUnsafe(argument);
        }
        void setArgument(size_t argument, JSValue value)
        {
            this[argumentOffset(argument)] = value;
        }

        JSValue getArgumentUnsafe(size_t argIndex) const
        {
            // User beware! This method does not verify that there is a valid
            // argument at the specified argIndex. This is used for debugging
            // and verification code only. The caller is expected to know what
            // he/she is doing when calling this method.
            return this[argumentOffset(argIndex)].jsValue();
        }

        static int thisArgumentOffset() { return argumentOffsetIncludingThis(0); }
        JSValue thisValue() const { return this[thisArgumentOffset()].jsValue(); }
        void setThisValue(JSValue value) { this[thisArgumentOffset()] = value; }

        // Under the constructor implemented in C++, thisValue holds the newTarget instead of the automatically constructed value.
        // The result of this function is only effective under the "construct" context.
        JSValue newTarget() const { return thisValue(); }

        JSValue argumentAfterCapture(size_t argument);

        static int offsetFor(size_t argumentCountIncludingThis) { return CallFrameSlot::thisArgument + argumentCountIncludingThis - 1; }

        static constexpr CallFrame* noCaller() { return nullptr; }

        bool isEmptyTopLevelCallFrameForDebugger() const
        {
            return callerFrameAndPC().callerFrame == noCaller() && callerFrameAndPC().returnPC == nullptr;
        }

        void convertToStackOverflowFrame(VM&, CodeBlock* codeBlockToKeepAliveUntilFrameIsUnwound);
        bool isPartiallyInitializedFrame() const;
        bool isNativeCalleeFrame() const;

        void setArgumentCountIncludingThis(int count) { static_cast<Register*>(this)[static_cast<int>(CallFrameSlot::argumentCountIncludingThis)].payload() = count; }
        inline void setCallee(JSObject*);
        inline void setCallee(NativeCallee*);
        inline void setCodeBlock(CodeBlock*);
        void setReturnPC(void* value) { callerFrameAndPC().returnPC = value; }

        JS_EXPORT_PRIVATE static JSGlobalObject* globalObjectOfClosestCodeBlock(VM&, CallFrame*);
        String friendlyFunctionName();

        void dump(PrintStream&) const;

        // This function is used in LLDB btjs.
        JS_EXPORT_PRIVATE const char* describeFrame();

    private:

        CallFrame();
        ~CallFrame();

        Register* topOfFrameInternal();

        // The following are for internal use in debugging and verification
        // code only and not meant as an API for general usage:

        size_t argIndexForRegister(Register* reg)
        {
            // The register at 'offset' number of slots from the frame pointer
            // i.e.
            //       reg = frame[offset];
            //   ==> reg = frame + offset;
            //   ==> offset = reg - frame;
            int offset = reg - this->registers();

            // The offset is defined (based on argumentOffset()) to be:
            //       offset = CallFrameSlot::firstArgument - argIndex;
            // Hence:
            //       argIndex = CallFrameSlot::firstArgument - offset;
            size_t argIndex = offset - CallFrameSlot::firstArgument;
            return argIndex;
        }

        CallerFrameAndPC& callerFrameAndPC() { return *reinterpret_cast<CallerFrameAndPC*>(this); }
        const CallerFrameAndPC& callerFrameAndPC() const { return *reinterpret_cast<const CallerFrameAndPC*>(this); }
        SUPPRESS_ASAN const CallerFrameAndPC& unsafeCallerFrameAndPC() const { return *reinterpret_cast<const CallerFrameAndPC*>(this); }
    };

JS_EXPORT_PRIVATE bool isFromJSCode(void* returnAddress);

#if USE(BUILTIN_FRAME_ADDRESS)
#if OS(WINDOWS)
// On Windows, __builtin_frame_address(1) doesn't work, it returns __builtin_frame_address(0)
// We can't use __builtin_frame_address(0) either, as on Windows it points at the space after
// function's local variables on the stack instead of before like other platforms.
// Instead we use _AddressOfReturnAddress(), and clobber rbp so it should be the first parameter
// saved by the currrent function.
#define DECLARE_CALL_FRAME(vm) \
    ({ \
        asm volatile( \
            "" \
            : /* no outputs */ \
            : /* no inputs */ \
            : "rbp" /* clobber rbp */ \
        ); \
        ASSERT(JSC::isFromJSCode(removeCodePtrTag<void*>(__builtin_return_address(0)))); \
        std::bit_cast<JSC::CallFrame*>(*((uintptr_t**) _AddressOfReturnAddress() - 1)); \
    })
#else // !OS(WINDOWS)
// FIXME (see rdar://72897291): Work around a Clang bug where __builtin_return_address()
// sometimes gives us a signed pointer, and sometimes does not.
#define DECLARE_CALL_FRAME(vm) \
    ({ \
        ASSERT(JSC::isFromJSCode(removeCodePtrTag<void*>(__builtin_return_address(0)))); \
        std::bit_cast<JSC::CallFrame*>(__builtin_frame_address(1)); \
    })
#endif // !OS(WINDOWS)
#else
#define DECLARE_CALL_FRAME(vm) ((vm).topCallFrame)
#endif

#if USE(BUILTIN_FRAME_ADDRESS)
#define DECLARE_WASM_CALL_FRAME(instance) DECLARE_CALL_FRAME(instance->vm())
#else
#define DECLARE_WASM_CALL_FRAME(instance) ((instance)->temporaryCallFrame())
#endif

} // namespace JSC

namespace WTF {

template<typename T> struct DefaultHash;
template<> struct DefaultHash<JSC::CallSiteIndex> : JSC::CallSiteIndexHash { };

template<typename T> struct HashTraits;
template<> struct HashTraits<JSC::CallSiteIndex> : SimpleClassHashTraits<JSC::CallSiteIndex> {
    static constexpr bool emptyValueIsZero = false;
};

} // namespace WTF

WTF_ALLOW_UNSAFE_BUFFER_USAGE_END
