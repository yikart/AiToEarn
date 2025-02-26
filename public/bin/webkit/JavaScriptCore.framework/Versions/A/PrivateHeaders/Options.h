/*
 * Copyright (C) 2011-2023 Apple Inc. All rights reserved.
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

#include "CPU.h"
#include "JSCConfig.h"
#include "JSExportMacros.h"
#include <stdint.h>
#include <wtf/ForbidHeapAllocation.h>
#include <wtf/Noncopyable.h>
#include <wtf/PrintStream.h>
#include <wtf/StdLibExtras.h>

namespace WTF {
class StringBuilder;
}
using WTF::StringBuilder;

namespace JSC {

class Options {
public:
    enum class SandboxPolicy : uint8_t {
        Unknown,
        Allow,
        Block,
    };

    enum class DumpLevel : uint8_t {
        None = 0,
        Overridden,
        All,
        Verbose
    };

    enum class Availability : uint8_t  {
        Normal = 0,
        Restricted,
        Configurable
    };

#define DECLARE_OPTION_ID(type_, name_, defaultValue_, availability_, description_) \
    name_##ID,

    enum ID : uint16_t {
        FOR_EACH_JSC_OPTION(DECLARE_OPTION_ID)
    };
#undef DECLARE_OPTION_ID

    enum class Type : uint8_t {
        Bool,
        Unsigned,
        Double,
        Int32,
        Size,
        OptionRange,
        OptionString,
        GCLogLevel,
        OSLogType,
    };

    class AllowUnfinalizedAccessScope {
        WTF_MAKE_NONCOPYABLE(AllowUnfinalizedAccessScope);
        WTF_FORBID_HEAP_ALLOCATION;
    public:
#if ASSERT_ENABLED
        AllowUnfinalizedAccessScope()
        {
            if (!g_jscConfig.options.isFinalized) {
                m_savedAllowUnfinalizedUse = g_jscConfig.options.allowUnfinalizedAccess;
                g_jscConfig.options.allowUnfinalizedAccess = true;
            }
        }

        ~AllowUnfinalizedAccessScope()
        {
            if (!g_jscConfig.options.isFinalized)
                g_jscConfig.options.allowUnfinalizedAccess = m_savedAllowUnfinalizedUse;
        }

    private:
        bool m_savedAllowUnfinalizedUse;
#else
        ALWAYS_INLINE AllowUnfinalizedAccessScope() = default;
        ALWAYS_INLINE ~AllowUnfinalizedAccessScope() { }
#endif
    };

    JS_EXPORT_PRIVATE static void initialize();
    static void finalize();

    JS_EXPORT_PRIVATE static bool setAllJITCodeValidations(const char* arg);

    // Parses a string of options where each option is of the format "--<optionName>=<value>"
    // and are separated by a space. The leading "--" is optional and will be ignored.
    JS_EXPORT_PRIVATE static bool setOptions(const char* optionsList);

    // Parses a single command line option in the format "<optionName>=<value>"
    // (no spaces allowed) and set the specified option if appropriate.
    JS_EXPORT_PRIVATE static bool setOption(const char* arg, bool verify = true);

    JS_EXPORT_PRIVATE static void executeDumpOptions();
    JS_EXPORT_PRIVATE static void dumpAllOptionsInALine(StringBuilder&);

    JS_EXPORT_PRIVATE static void assertOptionsAreCoherent();
    JS_EXPORT_PRIVATE static void notifyOptionsChanged();

#define DECLARE_OPTION_ACCESSORS(type_, name_, defaultValue_, availability_, description_) \
public: \
    ALWAYS_INLINE static OptionsStorage::type_& name_() \
    { \
        ASSERT(g_jscConfig.options.allowUnfinalizedAccess || g_jscConfig.options.isFinalized); \
        return g_jscConfig.options.name_; \
    }

    FOR_EACH_JSC_OPTION(DECLARE_OPTION_ACCESSORS)
#undef DECLARE_OPTION_ACCESSORS

    static bool isAvailable(ID, Availability);
    JS_EXPORT_PRIVATE static SandboxPolicy machExceptionHandlerSandboxPolicy;

private:
    Options();

    enum DumpDefaultsOption {
        DontDumpDefaults,
        DumpDefaults
    };
    static void dumpAllOptions(DumpLevel, ASCIILiteral title = { });
    static void dumpAllOptions(StringBuilder&, DumpLevel, ASCIILiteral title,
        ASCIILiteral separator, ASCIILiteral optionHeader, ASCIILiteral optionFooter, DumpDefaultsOption);
    static void dumpOption(StringBuilder&, DumpLevel, ID,
        ASCIILiteral optionHeader, ASCIILiteral optionFooter, DumpDefaultsOption);

    static bool setOptionWithoutAlias(const char* arg, bool verify = true);
    static bool setAliasedOption(const char* arg, bool verify = true);
#if !PLATFORM(COCOA)
    static bool overrideAliasedOptionWithHeuristic(const char* name);
#endif

    static void setAllJITCodeValidations(bool);

    static bool defaultTCSMValue();
    static unsigned computeNumberOfGCMarkers(unsigned maxNumberOfGCMarkers);
    static unsigned computeNumberOfWorkerThreads(int maxNumberOfWorkerThreads, int minimum = 1);
    static int32_t computePriorityDeltaOfWorkerThreads(int32_t twoCorePriorityDelta, int32_t multiCorePriorityDelta);
    static constexpr bool jitEnabledByDefault() { return is32Bit() || isAddress64Bit(); }
};

} // namespace JSC
