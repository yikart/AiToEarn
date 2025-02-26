/*
 * Copyright (C) 2009 Apple Inc. All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions
 * are met:
 *
 * 1.  Redistributions of source code must retain the above copyright
 *     notice, this list of conditions and the following disclaimer. 
 * 2.  Redistributions in binary form must reproduce the above copyright
 *     notice, this list of conditions and the following disclaimer in the
 *     documentation and/or other materials provided with the distribution. 
 * 3.  Neither the name of Apple Inc. ("Apple") nor the names of
 *     its contributors may be used to endorse or promote products derived
 *     from this software without specific prior written permission. 
 *
 * THIS SOFTWARE IS PROVIDED BY APPLE AND ITS CONTRIBUTORS "AS IS" AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL APPLE OR ITS CONTRIBUTORS BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
 * THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

#pragma once

#if PLATFORM(IOS_FAMILY)

#include "MIMETypeRegistry.h"
#include "WebCoreURLResponse.h"
#include <wtf/text/WTFString.h>

#if USE(QUICK_LOOK)
    
namespace WebCore {

inline bool shouldUseQuickLookForMIMEType(const String& mimeType)
{
    if ((!MIMETypeRegistry::isSupportedNonImageMIMEType(mimeType)         // ignore supported non-image MIME types
         && !MIMETypeRegistry::isSupportedImageMIMEType(mimeType)         // ignore supported image MIME types
         && mimeType != "text/css"_s                                      // ignore css
         && mimeType != "application/pdf"_s                               // ignore pdf
         )
        || mimeType == "text/plain"_s                                       // but keep text/plain which is too generic and can hide something
        || (mimeType == "text/xml"_s || mimeType == "application/xml"_s))   // and keep XML types for .mobileconfig files
    {
        return true;
    }

    return false;
}

} // namespace WebCore

#endif // USE(QUICK_LOOK)

#endif // PLATFORM(IOS_FAMILY)
