/*
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

#include <atomic>

namespace JSC {

class MacroAssembler;

extern "C" JS_EXPORT_PRIVATE std::atomic<uint32_t> g_superSamplerCount;

void initializeSuperSampler();

class SuperSamplerScope {
public:
    SuperSamplerScope(bool doSample = true)
        : m_doSample(doSample)
    {
        if (m_doSample)
            ++g_superSamplerCount;
    }

    ~SuperSamplerScope()
    {
        if (m_doSample)
            --g_superSamplerCount;
    }

    void release()
    {
        ASSERT(m_doSample);
        --g_superSamplerCount;
        m_doSample = false;
    }

private:
    bool m_doSample;
};

JS_EXPORT_PRIVATE void resetSuperSamplerState();
JS_EXPORT_PRIVATE void printSuperSamplerState();
JS_EXPORT_PRIVATE void enableSuperSampler();
JS_EXPORT_PRIVATE void disableSuperSampler();

} // namespace JSC
