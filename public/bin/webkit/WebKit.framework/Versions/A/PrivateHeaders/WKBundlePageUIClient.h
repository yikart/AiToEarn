/*
 * Copyright (C) 2013-2018 Apple Inc. All rights reserved.
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

#include <WebKit/WKBase.h>
#include <WebKit/WKEvent.h>

enum {
    WKBundlePageUIElementVisibilityUnknown,
    WKBundlePageUIElementVisible,
    WKBundlePageUIElementHidden
};
typedef uint32_t WKBundlePageUIElementVisibility;


typedef void (*WKBundlePageWillAddMessageToConsoleCallback)(WKBundlePageRef page, WKStringRef message, uint32_t lineNumber, const void *clientInfo);
typedef void (*WKBundlePageWillSetStatusbarTextCallback)(WKBundlePageRef page, WKStringRef statusbarText, const void *clientInfo);
typedef void (*WKBundlePageWillRunJavaScriptAlertCallback)(WKBundlePageRef page, WKStringRef alertText, WKBundleFrameRef frame, const void *clientInfo);
typedef void (*WKBundlePageWillRunJavaScriptConfirmCallback)(WKBundlePageRef page, WKStringRef message, WKBundleFrameRef frame, const void *clientInfo);
typedef void (*WKBundlePageWillRunJavaScriptPromptCallback)(WKBundlePageRef page, WKStringRef message, WKStringRef defaultValue, WKBundleFrameRef frame, const void *clientInfo);
typedef void (*WKBundlePageMouseDidMoveOverElementCallback)(WKBundlePageRef page, WKBundleHitTestResultRef hitTestResult, WKEventModifiers modifiers, WKTypeRef* userData, const void *clientInfo);
typedef void (*WKBundlePageDidScrollCallback)(WKBundlePageRef page, const void *clientInfo);
typedef WKStringRef (*WKBundlePageGenerateFileForUploadCallback)(WKBundlePageRef page, WKStringRef originalFilePath, const void* clientInfo);
typedef WKBundlePageUIElementVisibility (*WKBundlePageStatusBarIsVisibleCallback)(WKBundlePageRef page, const void *clientInfo);
typedef WKBundlePageUIElementVisibility (*WKBundlePageMenuBarIsVisibleCallback)(WKBundlePageRef page, const void *clientInfo);
typedef WKBundlePageUIElementVisibility (*WKBundlePageToolbarsAreVisibleCallback)(WKBundlePageRef page, const void *clientInfo);
typedef void (*WKBundlePageReachedAppCacheOriginQuotaCallback)(WKBundlePageRef page, WKSecurityOriginRef origin, int64_t totalBytesNeeded, const void *clientInfo);
typedef uint64_t (*WKBundlePageExceededDatabaseQuotaCallback)(WKBundlePageRef page, WKSecurityOriginRef origin, WKStringRef databaseName, WKStringRef databaseDisplayName, uint64_t currentQuotaBytes, uint64_t currentOriginUsageBytes, uint64_t currentDatabaseUsageBytes, uint64_t expectedUsageBytes, const void *clientInfo);
typedef WKStringRef (*WKBundlePagePlugInCreateStartLabelTitleCallback)(WKStringRef mimeType, const void *clientInfo);
typedef WKStringRef (*WKBundlePagePlugInCreateStartLabelSubtitleCallback)(WKStringRef mimeType, const void *clientInfo);
typedef WKStringRef (*WKBundlePagePlugInCreateExtraStyleSheetCallback)(const void *clientInfo);
typedef WKStringRef (*WKBundlePagePlugInCreateExtraScriptCallback)(const void *clientInfo);
typedef void (*WKBundlePageDidClickAutoFillButtonCallback)(WKBundlePageRef page, WKBundleNodeHandleRef inputElement, WKTypeRef* userData, const void *clientInfo);
typedef void (*WKBundlePageDidResignInputElementStrongPasswordAppearance)(WKBundlePageRef page, WKBundleNodeHandleRef inputElement, WKTypeRef* userData, const void *clientInfo);
typedef void (*WKBundlePageWillAddMessageWithDetailsToConsoleCallback)(WKBundlePageRef page, WKStringRef message, WKArrayRef messageArguments, uint32_t lineNumber, uint32_t columnNumber, WKStringRef sourceID, const void *clientInfo);

typedef struct WKBundlePageUIClientBase {
    int                                                                 version;
    const void *                                                        clientInfo;
} WKBundlePageUIClientBase;

typedef struct WKBundlePageUIClientV0 {
    WKBundlePageUIClientBase                                            base;

    // Version 0.
    WKBundlePageWillAddMessageToConsoleCallback                         willAddMessageToConsole;
    WKBundlePageWillSetStatusbarTextCallback                            willSetStatusbarText;
    WKBundlePageWillRunJavaScriptAlertCallback                          willRunJavaScriptAlert;
    WKBundlePageWillRunJavaScriptConfirmCallback                        willRunJavaScriptConfirm;
    WKBundlePageWillRunJavaScriptPromptCallback                         willRunJavaScriptPrompt;
    WKBundlePageMouseDidMoveOverElementCallback                         mouseDidMoveOverElement;
    WKBundlePageDidScrollCallback                                       pageDidScroll;
    void*                                                               unused1;
    WKBundlePageGenerateFileForUploadCallback                           shouldGenerateFileForUpload;
    WKBundlePageGenerateFileForUploadCallback                           generateFileForUpload;
    void*                                                               unused2;
    WKBundlePageStatusBarIsVisibleCallback                              statusBarIsVisible;
    WKBundlePageMenuBarIsVisibleCallback                                menuBarIsVisible;
    WKBundlePageToolbarsAreVisibleCallback                              toolbarsAreVisible;
} WKBundlePageUIClientV0;

typedef struct WKBundlePageUIClientV1 {
    WKBundlePageUIClientBase                                            base;

    // Version 0.
    WKBundlePageWillAddMessageToConsoleCallback                         willAddMessageToConsole;
    WKBundlePageWillSetStatusbarTextCallback                            willSetStatusbarText;
    WKBundlePageWillRunJavaScriptAlertCallback                          willRunJavaScriptAlert;
    WKBundlePageWillRunJavaScriptConfirmCallback                        willRunJavaScriptConfirm;
    WKBundlePageWillRunJavaScriptPromptCallback                         willRunJavaScriptPrompt;
    WKBundlePageMouseDidMoveOverElementCallback                         mouseDidMoveOverElement;
    WKBundlePageDidScrollCallback                                       pageDidScroll;
    void*                                                               unused1;
    WKBundlePageGenerateFileForUploadCallback                           shouldGenerateFileForUpload;
    WKBundlePageGenerateFileForUploadCallback                           generateFileForUpload;
    void*                                                               unused2;
    WKBundlePageStatusBarIsVisibleCallback                              statusBarIsVisible;
    WKBundlePageMenuBarIsVisibleCallback                                menuBarIsVisible;
    WKBundlePageToolbarsAreVisibleCallback                              toolbarsAreVisible;

    // Version 1.
    WKBundlePageReachedAppCacheOriginQuotaCallback                      didReachApplicationCacheOriginQuota;
} WKBundlePageUIClientV1;

typedef struct WKBundlePageUIClientV2 {
    WKBundlePageUIClientBase                                            base;

    // Version 0.
    WKBundlePageWillAddMessageToConsoleCallback                         willAddMessageToConsole;
    WKBundlePageWillSetStatusbarTextCallback                            willSetStatusbarText;
    WKBundlePageWillRunJavaScriptAlertCallback                          willRunJavaScriptAlert;
    WKBundlePageWillRunJavaScriptConfirmCallback                        willRunJavaScriptConfirm;
    WKBundlePageWillRunJavaScriptPromptCallback                         willRunJavaScriptPrompt;
    WKBundlePageMouseDidMoveOverElementCallback                         mouseDidMoveOverElement;
    WKBundlePageDidScrollCallback                                       pageDidScroll;
    void*                                                               unused1;
    WKBundlePageGenerateFileForUploadCallback                           shouldGenerateFileForUpload;
    WKBundlePageGenerateFileForUploadCallback                           generateFileForUpload;
    void*                                                               unused2;
    WKBundlePageStatusBarIsVisibleCallback                              statusBarIsVisible;
    WKBundlePageMenuBarIsVisibleCallback                                menuBarIsVisible;
    WKBundlePageToolbarsAreVisibleCallback                              toolbarsAreVisible;

    // Version 1.
    WKBundlePageReachedAppCacheOriginQuotaCallback                      didReachApplicationCacheOriginQuota;

    // Version 2.
    WKBundlePageExceededDatabaseQuotaCallback                           didExceedDatabaseQuota;
    WKBundlePagePlugInCreateStartLabelTitleCallback                     createPlugInStartLabelTitle;
    WKBundlePagePlugInCreateStartLabelSubtitleCallback                  createPlugInStartLabelSubtitle;
    WKBundlePagePlugInCreateExtraStyleSheetCallback                     createPlugInExtraStyleSheet;
    WKBundlePagePlugInCreateExtraScriptCallback                         createPlugInExtraScript;
} WKBundlePageUIClientV2;

typedef struct WKBundlePageUIClientV3 {
    WKBundlePageUIClientBase                                            base;

    // Version 0.
    WKBundlePageWillAddMessageToConsoleCallback                         willAddMessageToConsole;
    WKBundlePageWillSetStatusbarTextCallback                            willSetStatusbarText;
    WKBundlePageWillRunJavaScriptAlertCallback                          willRunJavaScriptAlert;
    WKBundlePageWillRunJavaScriptConfirmCallback                        willRunJavaScriptConfirm;
    WKBundlePageWillRunJavaScriptPromptCallback                         willRunJavaScriptPrompt;
    WKBundlePageMouseDidMoveOverElementCallback                         mouseDidMoveOverElement;
    WKBundlePageDidScrollCallback                                       pageDidScroll;
    void*                                                               unused1;
    WKBundlePageGenerateFileForUploadCallback                           shouldGenerateFileForUpload;
    WKBundlePageGenerateFileForUploadCallback                           generateFileForUpload;
    void*                                                               unused2;
    WKBundlePageStatusBarIsVisibleCallback                              statusBarIsVisible;
    WKBundlePageMenuBarIsVisibleCallback                                menuBarIsVisible;
    WKBundlePageToolbarsAreVisibleCallback                              toolbarsAreVisible;

    // Version 1.
    WKBundlePageReachedAppCacheOriginQuotaCallback                      didReachApplicationCacheOriginQuota;

    // Version 2.
    WKBundlePageExceededDatabaseQuotaCallback                           didExceedDatabaseQuota;
    WKBundlePagePlugInCreateStartLabelTitleCallback                     createPlugInStartLabelTitle;
    WKBundlePagePlugInCreateStartLabelSubtitleCallback                  createPlugInStartLabelSubtitle;
    WKBundlePagePlugInCreateExtraStyleSheetCallback                     createPlugInExtraStyleSheet;
    WKBundlePagePlugInCreateExtraScriptCallback                         createPlugInExtraScript;

    // Version 3.
    void*                                                               unused3;
    void*                                                               unused4;
    void*                                                               unused5;

    WKBundlePageDidClickAutoFillButtonCallback                          didClickAutoFillButton;
} WKBundlePageUIClientV3;

typedef struct WKBundlePageUIClientV4 {
    WKBundlePageUIClientBase                                            base;

    // Version 0.
    WKBundlePageWillAddMessageToConsoleCallback                         willAddMessageToConsole;
    WKBundlePageWillSetStatusbarTextCallback                            willSetStatusbarText;
    WKBundlePageWillRunJavaScriptAlertCallback                          willRunJavaScriptAlert;
    WKBundlePageWillRunJavaScriptConfirmCallback                        willRunJavaScriptConfirm;
    WKBundlePageWillRunJavaScriptPromptCallback                         willRunJavaScriptPrompt;
    WKBundlePageMouseDidMoveOverElementCallback                         mouseDidMoveOverElement;
    WKBundlePageDidScrollCallback                                       pageDidScroll;
    void*                                                               unused1;
    WKBundlePageGenerateFileForUploadCallback                           shouldGenerateFileForUpload;
    WKBundlePageGenerateFileForUploadCallback                           generateFileForUpload;
    void*                                                               unused2;
    WKBundlePageStatusBarIsVisibleCallback                              statusBarIsVisible;
    WKBundlePageMenuBarIsVisibleCallback                                menuBarIsVisible;
    WKBundlePageToolbarsAreVisibleCallback                              toolbarsAreVisible;

    // Version 1.
    WKBundlePageReachedAppCacheOriginQuotaCallback                      didReachApplicationCacheOriginQuota;

    // Version 2.
    WKBundlePageExceededDatabaseQuotaCallback                           didExceedDatabaseQuota;
    WKBundlePagePlugInCreateStartLabelTitleCallback                     createPlugInStartLabelTitle;
    WKBundlePagePlugInCreateStartLabelSubtitleCallback                  createPlugInStartLabelSubtitle;
    WKBundlePagePlugInCreateExtraStyleSheetCallback                     createPlugInExtraStyleSheet;
    WKBundlePagePlugInCreateExtraScriptCallback                         createPlugInExtraScript;

    // Version 3.
    void*                                                               unused3;
    void*                                                               unused4;
    void*                                                               unused5;

    WKBundlePageDidClickAutoFillButtonCallback                          didClickAutoFillButton;

    // Version 4.
    WKBundlePageDidResignInputElementStrongPasswordAppearance           didResignInputElementStrongPasswordAppearance;
} WKBundlePageUIClientV4;

typedef struct WKBundlePageUIClientV5 {
    WKBundlePageUIClientBase                                            base;

    // Version 0.
    WKBundlePageWillAddMessageToConsoleCallback                         willAddMessageToConsole;
    WKBundlePageWillSetStatusbarTextCallback                            willSetStatusbarText;
    WKBundlePageWillRunJavaScriptAlertCallback                          willRunJavaScriptAlert;
    WKBundlePageWillRunJavaScriptConfirmCallback                        willRunJavaScriptConfirm;
    WKBundlePageWillRunJavaScriptPromptCallback                         willRunJavaScriptPrompt;
    WKBundlePageMouseDidMoveOverElementCallback                         mouseDidMoveOverElement;
    WKBundlePageDidScrollCallback                                       pageDidScroll;
    void*                                                               unused1;
    WKBundlePageGenerateFileForUploadCallback                           shouldGenerateFileForUpload;
    WKBundlePageGenerateFileForUploadCallback                           generateFileForUpload;
    void*                                                               unused2;
    WKBundlePageStatusBarIsVisibleCallback                              statusBarIsVisible;
    WKBundlePageMenuBarIsVisibleCallback                                menuBarIsVisible;
    WKBundlePageToolbarsAreVisibleCallback                              toolbarsAreVisible;

    // Version 1.
    WKBundlePageReachedAppCacheOriginQuotaCallback                      didReachApplicationCacheOriginQuota;

    // Version 2.
    WKBundlePageExceededDatabaseQuotaCallback                           didExceedDatabaseQuota;
    WKBundlePagePlugInCreateStartLabelTitleCallback                     createPlugInStartLabelTitle;
    WKBundlePagePlugInCreateStartLabelSubtitleCallback                  createPlugInStartLabelSubtitle;
    WKBundlePagePlugInCreateExtraStyleSheetCallback                     createPlugInExtraStyleSheet;
    WKBundlePagePlugInCreateExtraScriptCallback                         createPlugInExtraScript;

    // Version 3.
    void*                                                               unused3;
    void*                                                               unused4;
    void*                                                               unused5;

    WKBundlePageDidClickAutoFillButtonCallback                          didClickAutoFillButton;

    // Version 4.
    WKBundlePageDidResignInputElementStrongPasswordAppearance           didResignInputElementStrongPasswordAppearance;

    // Version 5.
    WKBundlePageWillAddMessageWithDetailsToConsoleCallback              willAddMessageWithDetailsToConsole;
} WKBundlePageUIClientV5;
