/*
 * Copyright (C) 2014-2024 Apple Inc. All rights reserved.
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

#import <WebKit/NSAttributedString.h>
#import <WebKit/WKBackForwardList.h>
#import <WebKit/WKBackForwardListItem.h>
#import <WebKit/WKContentRuleList.h>
#import <WebKit/WKContentRuleListStore.h>
#import <WebKit/WKContentWorld.h>
#import <WebKit/WKContextMenuElementInfo.h>
#import <WebKit/WKDownload.h>
#import <WebKit/WKDownloadDelegate.h>
#import <WebKit/WKError.h>
#import <WebKit/WKFindConfiguration.h>
#import <WebKit/WKFindResult.h>
#import <WebKit/WKFoundation.h>
#import <WebKit/WKFrameInfo.h>
#import <WebKit/WKHTTPCookieStore.h>
#import <WebKit/WKNavigation.h>
#import <WebKit/WKNavigationAction.h>
#import <WebKit/WKNavigationDelegate.h>
#import <WebKit/WKNavigationResponse.h>
#import <WebKit/WKOpenPanelParameters.h>
#import <WebKit/WKPDFConfiguration.h>
#import <WebKit/WKPreferences.h>
#import <WebKit/WKPreviewActionItem.h>
#import <WebKit/WKPreviewActionItemIdentifiers.h>
#import <WebKit/WKPreviewElementInfo.h>
#import <WebKit/WKProcessPool.h>
#import <WebKit/WKScriptMessage.h>
#import <WebKit/WKScriptMessageHandler.h>
#import <WebKit/WKScriptMessageHandlerWithReply.h>
#import <WebKit/WKSecurityOrigin.h>
#import <WebKit/WKSnapshotConfiguration.h>
#import <WebKit/WKUIDelegate.h>
#import <WebKit/WKURLSchemeHandler.h>
#import <WebKit/WKURLSchemeTask.h>
#import <WebKit/WKUserContentController.h>
#import <WebKit/WKUserScript.h>
#import <WebKit/WKWebExtension.h>
#import <WebKit/WKWebExtensionAction.h>
#import <WebKit/WKWebExtensionCommand.h>
#import <WebKit/WKWebExtensionContext.h>
#import <WebKit/WKWebExtensionController.h>
#import <WebKit/WKWebExtensionControllerConfiguration.h>
#import <WebKit/WKWebExtensionControllerDelegate.h>
#import <WebKit/WKWebExtensionDataRecord.h>
#import <WebKit/WKWebExtensionDataType.h>
#import <WebKit/WKWebExtensionMatchPattern.h>
#import <WebKit/WKWebExtensionMessagePort.h>
#import <WebKit/WKWebExtensionPermission.h>
#import <WebKit/WKWebExtensionTab.h>
#import <WebKit/WKWebExtensionTabConfiguration.h>
#import <WebKit/WKWebExtensionWindow.h>
#import <WebKit/WKWebExtensionWindowConfiguration.h>
#import <WebKit/WKWebView.h>
#import <WebKit/WKWebViewConfiguration.h>
#import <WebKit/WKWebpagePreferences.h>
#import <WebKit/WKWebsiteDataRecord.h>
#import <WebKit/WKWebsiteDataStore.h>
#import <WebKit/WKWindowFeatures.h>

#if !defined(TARGET_OS_MACCATALYST) || !TARGET_OS_MACCATALYST
#import <WebKit/WebKitLegacy.h>
#endif
