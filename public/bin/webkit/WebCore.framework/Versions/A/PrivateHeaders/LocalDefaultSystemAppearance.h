/*
 * Copyright (C) 2018 Apple Inc. All rights reserved.
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

#include "Color.h"
#include <wtf/Noncopyable.h>
#include <wtf/RetainPtr.h>

#if USE(APPKIT)

OBJC_CLASS NSAppearance;

namespace WebCore {

class Color;
    
// This class automatically saves and restores the current NSAppearance for
// functions which call out into AppKit and rely on the current NSAppearance being set
class LocalDefaultSystemAppearance {
    WTF_MAKE_NONCOPYABLE(LocalDefaultSystemAppearance);

public:
    WEBCORE_EXPORT LocalDefaultSystemAppearance(bool useDarkAppearance, const Color& tintColor = { });
    WEBCORE_EXPORT ~LocalDefaultSystemAppearance();

    bool usingDarkAppearance() const { return m_usingDarkAppearance; }

private:
    RetainPtr<NSAppearance> m_savedSystemAppearance;
    bool m_usingDarkAppearance { false };
};
    
}

#endif // USE(APPKIT)
