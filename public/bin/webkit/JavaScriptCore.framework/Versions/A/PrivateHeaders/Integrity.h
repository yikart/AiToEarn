/*
 * Copyright (C) 2019-2022 Apple Inc. All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions
 * are met:
 * 1. Redistributions of source code must retain the above copyright
 *    notice, this list of conditions and the following disclaimer.
 * 2. Redistributions in binary form must reproduce the above copyright
 *    notice, this list of conditions and the following disclaimer in the
 *    documentation and/or other materials provided with the distribution.
 *
 * THIS SOFTWARE IS PROVIDED BY APPLE INC. ``AS IS'' AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR
 * PURPOSE ARE DISCLAIMED.  IN NO EVENT SHALL APPLE INC. OR
 * CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
 * EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
 * PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
 * PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY
 * OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

#pragma once

#include <wtf/AccessibleAddress.h>
#include <wtf/Assertions.h>
#include <wtf/Lock.h>

#if OS(DARWIN)
#include <mach/vm_param.h>
#endif

#if USE(JSVALUE32)
#define ENABLE_EXTRA_INTEGRITY_CHECKS 0 // Not supported.
#else
// Force ENABLE_EXTRA_INTEGRITY_CHECKS to 1 for your local build if you want
// more prolific audits to be enabled.
#define ENABLE_EXTRA_INTEGRITY_CHECKS 0
#endif

// From API/JSBase.h
typedef const struct OpaqueJSContextGroup* JSContextGroupRef;
typedef const struct OpaqueJSContext* JSContextRef;
typedef struct OpaqueJSContext* JSGlobalContextRef;
typedef struct OpaqueJSPropertyNameAccumulator* JSPropertyNameAccumulatorRef;
typedef const struct OpaqueJSValue* JSValueRef;
typedef struct OpaqueJSValue* JSObjectRef;

namespace WTF {
class PrintStream;
}

namespace JSC {

class JSCell;
class JSGlobalObject;
class JSObject;
class JSValue;
class Structure;
class StructureID;
class VM;

namespace Integrity {

enum class AuditLevel {
    None,
    Minimal,
    Full,
    Random,
};

#ifdef NDEBUG
static constexpr AuditLevel DefaultAuditLevel = AuditLevel::None;
#else
static constexpr AuditLevel DefaultAuditLevel = AuditLevel::Random;
#endif

class Random {
public:
    Random(VM&);

    ALWAYS_INLINE bool shouldAudit(VM&);

private:
    JS_EXPORT_PRIVATE bool reloadAndCheckShouldAuditSlow(VM&);

    uint64_t m_triggerBits;
    Lock m_lock;

    // The top bit is reserved as a termination bit. Hence, the number of
    // trigger bits is always 1 less than will fit in m_triggerBits.
    static constexpr int numberOfTriggerBits = (sizeof(m_triggerBits) * CHAR_BIT) - 1;
};

ALWAYS_INLINE static bool isSanePointer(const void* pointer)
{
    uintptr_t pointerAsInt = std::bit_cast<uintptr_t>(pointer);
#if CPU(ARM64) && CPU(ADDRESS64)
    // On ARM64, top byte ignore means we can ignore these bits for addresses.
    pointerAsInt &= std::numeric_limits<uintptr_t>::max() >> CHAR_BIT;
#endif
    if (pointerAsInt < lowestAccessibleAddress())
        return false;
#if CPU(ADDRESS64)
    uintptr_t canonicalPointerBits = pointerAsInt << (64 - OS_CONSTANT(EFFECTIVE_ADDRESS_WIDTH));
    uintptr_t nonCanonicalPointerBits = pointerAsInt >> OS_CONSTANT(EFFECTIVE_ADDRESS_WIDTH);
    return !nonCanonicalPointerBits && canonicalPointerBits;
#else
    return true;
#endif // CPU(ADDRESS64)
}

#if USE(JSVALUE64)

class Analyzer {
public:
    enum Action { LogOnly, LogAndCrash };

    static bool analyzeVM(VM&, Action);
    static bool analyzeCell(VM&, JSCell*, Action);
    static bool analyzeCell(JSCell*, Action);
};

JS_EXPORT_PRIVATE JSContextRef doAudit(JSContextRef);
JS_EXPORT_PRIVATE JSGlobalContextRef doAudit(JSGlobalContextRef);
JS_EXPORT_PRIVATE JSObjectRef doAudit(JSObjectRef);
JS_EXPORT_PRIVATE JSValueRef doAudit(JSValueRef);

JS_EXPORT_PRIVATE JSValue doAudit(JSValue);
JS_EXPORT_PRIVATE JSCell* doAudit(JSCell*);
JS_EXPORT_PRIVATE JSCell* doAudit(VM&, JSCell*);
JS_EXPORT_PRIVATE JSObject* doAudit(JSObject*);
JS_EXPORT_PRIVATE JSGlobalObject* doAudit(JSGlobalObject*);

VM* doAudit(VM*); // see IntegrityInlines.h

// These are used for debugging queries, and will not crash.
JS_EXPORT_PRIVATE bool verifyCell(JSCell*);
JS_EXPORT_PRIVATE bool verifyCell(VM&, JSCell*);

#endif // USE(JSVALUE64)

ALWAYS_INLINE void auditCellRandomly(VM&, JSCell*);
ALWAYS_INLINE void auditCellMinimally(VM&, JSCell*);
JS_EXPORT_PRIVATE void auditCellMinimallySlow(VM&, JSCell*);
ALWAYS_INLINE void auditCellFully(VM&, JSCell*);

template<AuditLevel = AuditLevel::Random, typename T>
ALWAYS_INLINE void auditCell(VM&, T) { }

template<AuditLevel auditLevel = DefaultAuditLevel>
ALWAYS_INLINE void auditCell(VM& vm, JSCell* cell)
{
    static_assert(auditLevel == AuditLevel::None || auditLevel == AuditLevel::Minimal || auditLevel == AuditLevel::Full || auditLevel == AuditLevel::Random);

    UNUSED_PARAM(vm);
    UNUSED_PARAM(cell);
    if constexpr (auditLevel == AuditLevel::None)
        return;
    if constexpr (auditLevel == AuditLevel::Minimal)
        return auditCellMinimally(vm, cell);
    if constexpr (auditLevel == AuditLevel::Full)
        return auditCellFully(vm, cell);
    if constexpr (auditLevel == AuditLevel::Random)
        return auditCellRandomly(vm, cell);
}

template<AuditLevel auditLevel = DefaultAuditLevel>
ALWAYS_INLINE void auditCell(VM&, JSValue);

ALWAYS_INLINE void auditStructureID(StructureID);

#if ENABLE(EXTRA_INTEGRITY_CHECKS) && USE(JSVALUE64)
template<typename T> ALWAYS_INLINE T audit(T value) { return std::bit_cast<T>(doAudit(value)); }
#else
template<typename T> ALWAYS_INLINE T audit(T value) { return value; }
#endif

#if !VA_OPT_SUPPORTED

#define IA_LOG(assertion, format, ...) do { \
        Integrity::logLnF("ERROR: %s @ %s:%d", #assertion, __FILE__, __LINE__); \
    } while (false)

#define IA_ASSERT_WITH_ACTION(assertion, action, ...) do { \
        if (UNLIKELY(!(assertion))) { \
            IA_LOG(assertion, __VA_ARGS__); \
            WTFReportBacktraceWithPrefixAndPrintStream(Integrity::logFile(), "    "); \
            action; \
        } \
    } while (false)

#define IA_ASSERT(assertion, ...) \
    IA_ASSERT_WITH_ACTION(assertion, { \
        RELEASE_ASSERT((assertion)); \
    })

#else // not !VA_OPT_SUPPORTED

#define IA_LOG(assertion, format, ...) do { \
        Integrity::logLnF("ERROR: %s @ %s:%d", #assertion, __FILE__, __LINE__); \
        Integrity::logLnF("    " format __VA_OPT__(,) __VA_ARGS__); \
    } while (false)

#define IA_ASSERT_WITH_ACTION(assertion, action, ...) do { \
        if (UNLIKELY(!(assertion))) { \
            IA_LOG(assertion, __VA_ARGS__); \
            WTFReportBacktraceWithPrefixAndPrintStream(Integrity::logFile(), "    "); \
            action; \
        } \
    } while (false)

#define IA_ASSERT(assertion, ...) \
    IA_ASSERT_WITH_ACTION(assertion, { \
        RELEASE_ASSERT((assertion) __VA_OPT__(,) __VA_ARGS__); \
    } __VA_OPT__(,) __VA_ARGS__)

#endif // !VA_OPT_SUPPORTED

JS_EXPORT_PRIVATE WTF::PrintStream& logFile();
JS_EXPORT_PRIVATE void logF(const char* format, ...) WTF_ATTRIBUTE_PRINTF(1, 2);
JS_EXPORT_PRIVATE void logLnF(const char* format, ...) WTF_ATTRIBUTE_PRINTF(1, 2);

} // namespace Integrity

} // namespace JSC
