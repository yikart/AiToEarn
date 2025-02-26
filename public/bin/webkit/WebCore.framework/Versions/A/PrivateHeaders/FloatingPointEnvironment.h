/*
 * Copyright (C) 2014 Apple Inc. All rights reserved.
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

#ifndef FloatingPointEnvironment_h
#define FloatingPointEnvironment_h

#import <fenv.h>

namespace WebCore {

#if PLATFORM(IOS_FAMILY) && (CPU(ARM) || CPU(ARM64))

class FloatingPointEnvironment {
public:
    FloatingPointEnvironment();

    WEBCORE_EXPORT void enableDenormalSupport();
    WEBCORE_EXPORT void saveMainThreadEnvironment();
    void propagateMainThreadEnvironment();

    WEBCORE_EXPORT static FloatingPointEnvironment& singleton();

private:

    fenv_t m_mainThreadEnvironment;
    bool m_isInitialized;
};

#else // not PLATFORM(IOS_FAMILY) && (CPU(ARM) || CPU(ARM64))

class FloatingPointEnvironment {
public:
    FloatingPointEnvironment() = default;
    void enableDenormalSupport() { }
    void saveMainThreadEnvironment() { }
    void propagateMainThreadEnvironment() { }
    WEBCORE_EXPORT static FloatingPointEnvironment& singleton();
};

#endif // PLATFORM(IOS_FAMILY) && (CPU(ARM) || CPU(ARM64))

} // namespace WebCore

using WebCore::FloatingPointEnvironment;

#endif // FloatingPointEnvironment_h

