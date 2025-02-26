/*
 * Copyright (C) 2015 Apple Inc. All rights reserved.
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

#import <Foundation/Foundation.h>

WK_EXTERN NSString * const _WKMenuItemIdentifierCopy WK_API_AVAILABLE(macos(10.12), ios(10.0));
WK_EXTERN NSString * const _WKMenuItemIdentifierCopyImage WK_API_AVAILABLE(macos(10.12), ios(10.0));
WK_EXTERN NSString * const _WKMenuItemIdentifierCopyLink WK_API_AVAILABLE(macos(10.12), ios(10.0));
WK_EXTERN NSString * const _WKMenuItemIdentifierCopyLinkWithHighlight WK_API_AVAILABLE(macos(WK_MAC_TBA), ios(WK_IOS_TBA), visionos(WK_XROS_TBA));
WK_EXTERN NSString * const _WKMenuItemIdentifierCopyMediaLink WK_API_AVAILABLE(macos(10.14), ios(12.0));
WK_EXTERN NSString * const _WKMenuItemIdentifierDownloadImage WK_API_AVAILABLE(macos(10.12), ios(10.0));
WK_EXTERN NSString * const _WKMenuItemIdentifierDownloadLinkedFile WK_API_AVAILABLE(macos(10.12), ios(10.0));
WK_EXTERN NSString * const _WKMenuItemIdentifierDownloadMedia WK_API_AVAILABLE(macos(10.14), ios(12.0));
WK_EXTERN NSString * const _WKMenuItemIdentifierGoBack WK_API_AVAILABLE(macos(10.12), ios(10.0));
WK_EXTERN NSString * const _WKMenuItemIdentifierGoForward WK_API_AVAILABLE(macos(10.12), ios(10.0));
WK_EXTERN NSString * const _WKMenuItemIdentifierInspectElement WK_API_AVAILABLE(macos(10.12), ios(10.0));
WK_EXTERN NSString * const _WKMenuItemIdentifierLookUp WK_API_AVAILABLE(macos(10.12), ios(10.0));
WK_EXTERN NSString * const _WKMenuItemIdentifierOpenFrameInNewWindow WK_API_AVAILABLE(macos(10.12), ios(10.0));
WK_EXTERN NSString * const _WKMenuItemIdentifierOpenImageInNewWindow WK_API_AVAILABLE(macos(10.12), ios(10.0));
WK_EXTERN NSString * const _WKMenuItemIdentifierOpenLink WK_API_AVAILABLE(macos(10.12), ios(10.0));
WK_EXTERN NSString * const _WKMenuItemIdentifierOpenLinkInNewWindow WK_API_AVAILABLE(macos(10.12), ios(10.0));
WK_EXTERN NSString * const _WKMenuItemIdentifierOpenMediaInNewWindow WK_API_AVAILABLE(macos(10.14), ios(12.0));
WK_EXTERN NSString * const _WKMenuItemIdentifierPaste WK_API_AVAILABLE(macos(10.12), ios(10.0));
WK_EXTERN NSString * const _WKMenuItemIdentifierReload WK_API_AVAILABLE(macos(10.12), ios(10.0));
WK_EXTERN NSString * const _WKMenuItemIdentifierRevealImage WK_API_AVAILABLE(macos(12.0), ios(15.0));
WK_EXTERN NSString * const _WKMenuItemIdentifierSearchWeb WK_API_AVAILABLE(macos(10.12), ios(10.0));
WK_EXTERN NSString * const _WKMenuItemIdentifierShowHideMediaControls WK_API_AVAILABLE(macos(10.12), ios(10.0));
WK_EXTERN NSString * const _WKMenuItemIdentifierShowHideMediaStats WK_API_AVAILABLE(macos(13.3), ios(16.4));
WK_EXTERN NSString * const _WKMenuItemIdentifierToggleEnhancedFullScreen WK_API_AVAILABLE(macos(10.14), ios(12.0));
WK_EXTERN NSString * const _WKMenuItemIdentifierToggleVideoViewer WK_API_AVAILABLE(macos(15.0), ios(18.0));
WK_EXTERN NSString * const _WKMenuItemIdentifierToggleFullScreen WK_API_AVAILABLE(macos(10.12), ios(10.0));

WK_EXTERN NSString * const _WKMenuItemIdentifierShareMenu WK_API_AVAILABLE(macos(10.12), ios(10.0));
WK_EXTERN NSString * const _WKMenuItemIdentifierSpeechMenu WK_API_AVAILABLE(macos(10.12), ios(10.0));

WK_EXTERN NSString * const _WKMenuItemIdentifierAddHighlightToCurrentQuickNote WK_API_AVAILABLE(macos(12.0), ios(15.0));
WK_EXTERN NSString * const _WKMenuItemIdentifierAddHighlightToNewQuickNote WK_API_AVAILABLE(macos(12.0), ios(15.0));

WK_EXTERN NSString * const _WKMenuItemIdentifierTranslate WK_API_AVAILABLE(macos(12.0), ios(15.0));
WK_EXTERN NSString * const _WKMenuItemIdentifierWritingTools WK_API_AVAILABLE(macos(15.0), ios(18.0), visionos(2.0));
WK_EXTERN NSString * const _WKMenuItemIdentifierCopySubject WK_API_AVAILABLE(macos(13.0), ios(16.0));

WK_EXTERN NSString * const _WKMenuItemIdentifierSpellingMenu WK_API_AVAILABLE(macos(13.0), ios(16.0));
WK_EXTERN NSString * const _WKMenuItemIdentifierShowSpellingPanel WK_API_AVAILABLE(macos(13.0), ios(16.0));
WK_EXTERN NSString * const _WKMenuItemIdentifierCheckSpelling WK_API_AVAILABLE(macos(13.0), ios(16.0));
WK_EXTERN NSString * const _WKMenuItemIdentifierCheckSpellingWhileTyping WK_API_AVAILABLE(macos(13.0), ios(16.0));
WK_EXTERN NSString * const _WKMenuItemIdentifierCheckGrammarWithSpelling WK_API_AVAILABLE(macos(13.0), ios(16.0));
WK_EXTERN NSString * const _WKMenuItemIdentifierPlayAllAnimations WK_API_AVAILABLE(macos(13.3), ios(16.4));
WK_EXTERN NSString * const _WKMenuItemIdentifierPauseAllAnimations WK_API_AVAILABLE(macos(13.3), ios(16.4));
WK_EXTERN NSString * const _WKMenuItemIdentifierPlayAnimation  WK_API_AVAILABLE(macos(14.0), ios(17.0));
WK_EXTERN NSString * const _WKMenuItemIdentifierPauseAnimation  WK_API_AVAILABLE(macos(14.0), ios(17.0));
