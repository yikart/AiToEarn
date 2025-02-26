/*
 * Copyright (C) 2009-2017 Apple Inc. All rights reserved.
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

#include <wtf/RetainPtr.h>

OBJC_CLASS NSData;
OBJC_CLASS NSSet;
OBJC_CLASS NSString;
OBJC_CLASS NSURL;
OBJC_CLASS NSURLRequest;

namespace WebCore {

WEBCORE_EXPORT NSSet *QLPreviewGetSupportedMIMETypesSet();
WEBCORE_EXPORT void removeQLPreviewConverterForURL(NSURL *);
WEBCORE_EXPORT RetainPtr<NSURLRequest> registerQLPreviewConverterIfNeeded(NSURL *, NSString *mimeType, NSData *);
WEBCORE_EXPORT bool isQuickLookPreviewURL(const URL&);
WEBCORE_EXPORT NSString *createTemporaryFileForQuickLook(NSString *fileName);

static constexpr auto QLPreviewProtocol = "x-apple-ql-id"_s;

} // namespace WebCore
