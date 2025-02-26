/*
 * Copyright (C) 2014-2015 Apple Inc. All rights reserved.
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

#ifndef PathUtilities_h
#define PathUtilities_h

#include "FloatRoundedRect.h"
#include "Path.h"
#include "WritingMode.h"
#include <wtf/Vector.h>

namespace WebCore {
class BorderData;
    
class PathUtilities {
public:
    WEBCORE_EXPORT static Path pathWithShrinkWrappedRects(const Vector<FloatRect>& rects, float radius);
    WEBCORE_EXPORT static Path pathWithShrinkWrappedRects(const Vector<FloatRect>&, const FloatRoundedRect::Radii&);
    WEBCORE_EXPORT static Vector<Path> pathsWithShrinkWrappedRects(const Vector<FloatRect>& rects, float radius);

    static Path pathWithShrinkWrappedRectsForOutline(const Vector<FloatRect>&, const BorderData&, float outlineOffset, WritingMode, float deviceScaleFactor);
};

}

#endif
