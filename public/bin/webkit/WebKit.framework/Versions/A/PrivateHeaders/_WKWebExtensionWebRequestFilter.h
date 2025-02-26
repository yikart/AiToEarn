/*
 * Copyright (C) 2024 Apple Inc. All rights reserved.
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

#import <WebKit/WKFoundation.h>

#ifdef __cplusplus
namespace WebKit {
struct ResourceLoadInfo;
}
#endif

NS_ASSUME_NONNULL_BEGIN

// https://developer.mozilla.org/docs/Mozilla/Add-ons/WebExtensions/API/webRequest/ResourceType
typedef NS_ENUM(NSInteger, _WKWebExtensionWebRequestResourceType) {
    _WKWebExtensionWebRequestResourceTypeMainFrame,
    _WKWebExtensionWebRequestResourceTypeSubframe,
    _WKWebExtensionWebRequestResourceTypeStylesheet,
    _WKWebExtensionWebRequestResourceTypeScript,
    _WKWebExtensionWebRequestResourceTypeImage,
    _WKWebExtensionWebRequestResourceTypeFont,
    _WKWebExtensionWebRequestResourceTypeObject,
    _WKWebExtensionWebRequestResourceTypeXMLHTTPRequest,
    _WKWebExtensionWebRequestResourceTypePing,
    _WKWebExtensionWebRequestResourceTypeCSPReport,
    _WKWebExtensionWebRequestResourceTypeMedia,
    _WKWebExtensionWebRequestResourceTypeWebsocket,
    _WKWebExtensionWebRequestResourceTypeApplicationManifest,
    _WKWebExtensionWebRequestResourceTypeXSLT,
    _WKWebExtensionWebRequestResourceTypeBeacon,
    _WKWebExtensionWebRequestResourceTypeOther,
};

#ifdef __cplusplus
WK_EXTERN _WKWebExtensionWebRequestResourceType toWebExtensionWebRequestResourceType(const WebKit::ResourceLoadInfo&);
#endif

// https://developer.mozilla.org/docs/Mozilla/Add-ons/WebExtensions/API/webRequest/RequestFilter
WK_EXTERN
@interface _WKWebExtensionWebRequestFilter : NSObject

- (nullable instancetype)initWithDictionary:(NSDictionary<NSString *, id> *)dictionary outErrorMessage:(NSString * _Nullable * _Nonnull)outErrorMessage;

- (BOOL)matchesRequestForResourceOfType:(_WKWebExtensionWebRequestResourceType)resourceType URL:(NSURL *)URL tabID:(double)tabID windowID:(double)windowID;

@end

NS_ASSUME_NONNULL_END
