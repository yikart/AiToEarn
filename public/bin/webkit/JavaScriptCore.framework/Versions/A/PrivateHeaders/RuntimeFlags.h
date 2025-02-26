/*
 * Copyright (C) 2015 Yusuke Suzuki <utatane.tea@gmail.com>.
 * Copyright (C) 2016 Apple Inc. All rights reserved.
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
 * THIS SOFTWARE IS PROVIDED BY APPLE INC. AND ITS CONTRIBUTORS ``AS IS''
 * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO,
 * THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR
 * PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL APPLE INC. OR ITS CONTRIBUTORS
 * BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
 * CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
 * SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
 * INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
 * CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 * ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF
 * THE POSSIBILITY OF SUCH DAMAGE.
 */

#pragma once

#include <initializer_list>

namespace JSC {

// macro(name, isEnabledFlag)
#define JSC_RUNTIME_FLAG(macro)

class RuntimeFlags {
private:
    enum RuntimeFlagShiftValue : unsigned {
#define JSC_DECLARE_RUNTIME_FLAG_SHIFT_VALUE(name, isEnabledFlag) shiftValueFor##name,
        JSC_RUNTIME_FLAG(JSC_DECLARE_RUNTIME_FLAG_SHIFT_VALUE)
#undef JSC_DECLARE_RUNTIME_FLAG_SHIFT_VALUE
    };

public:
    enum RuntimeFlag : unsigned {
#define JSC_DECLARE_RUNTIME_FLAG(name, isEnabledFlag) name = 1u << (shiftValueFor##name),
        JSC_RUNTIME_FLAG(JSC_DECLARE_RUNTIME_FLAG)
#undef JSC_DECLARE_RUNTIME_FLAG
    };

#define JSC_DECLARE_RUNTIME_FLAG_ACCESSOR(name, isEnabledFlag) \
    void set##name(bool value)\
    {\
        if (value)\
            m_flags |= name;\
        else\
            m_flags &= (~name);\
    }\
    bool is##name() const\
    {\
        return m_flags & name;\
    }
    JSC_RUNTIME_FLAG(JSC_DECLARE_RUNTIME_FLAG_ACCESSOR)
#undef JSC_DECLARE_RUNTIME_FLAG_ACCESSOR

    RuntimeFlags()
        : RuntimeFlags(0u)
    {
    }

    RuntimeFlags(std::initializer_list<RuntimeFlag> initializerList)
        : RuntimeFlags()
    {
        for (RuntimeFlag flag : initializerList)
            m_flags |= flag;
    }

    explicit RuntimeFlags(unsigned flags)
        : m_flags(flags)
    {
    }

    static RuntimeFlags createAllEnabled()
    {
        return RuntimeFlags(
#define JSC_USE_RUNTIME_FLAG(name, isEnabledFlag) ((isEnabledFlag) ? name : 0u) |
            JSC_RUNTIME_FLAG(JSC_USE_RUNTIME_FLAG)
#undef JSC_USE_RUNTIME_FLAG
            0u
        );
    }

    RuntimeFlags isolatedCopy() const { return RuntimeFlags(m_flags); }

private:
    unsigned m_flags;
};

} // namespace JSC
