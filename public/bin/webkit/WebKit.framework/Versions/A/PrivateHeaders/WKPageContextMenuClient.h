/*
 * Copyright (C) 2013 Apple Inc. All rights reserved.
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

#ifndef WKPageContextMenuClient_h
#define WKPageContextMenuClient_h

#include <WebKit/WKBase.h>
#include <WebKit/WKGeometry.h>

#ifdef __cplusplus
extern "C" {
#endif

typedef void (*WKPageGetContextMenuFromProposedContextMenuCallback)(WKPageRef page, WKArrayRef proposedMenu, WKArrayRef* newMenu, WKHitTestResultRef hitTestResult, WKTypeRef userData, const void* clientInfo);
typedef void (*WKPageGetContextMenuFromProposedContextMenuCallbackAsync)(WKPageRef page, WKArrayRef proposedMenu, WKContextMenuListenerRef listener, WKHitTestResultRef hitTestResult, WKTypeRef userData, const void* clientInfo);
typedef void (*WKPageCustomContextMenuItemSelectedCallback)(WKPageRef page, WKContextMenuItemRef contextMenuItem, const void* clientInfo);
typedef void (*WKPageContextMenuDismissedCallback)(WKPageRef page, const void* clientInfo);
typedef void (*WKPageShowContextMenuCallback)(WKPageRef page, WKPoint menuLocation, WKArrayRef menuItems, const void* clientInfo);
typedef void (*WKPageHideContextMenuCallback)(WKPageRef page, const void* clientInfo);

// Deprecated
typedef void (*WKPageGetContextMenuFromProposedContextMenuCallback_deprecatedForUseWithV0)(WKPageRef page, WKArrayRef proposedMenu, WKArrayRef* newMenu, WKTypeRef userData, const void* clientInfo);

typedef struct WKPageContextMenuClientBase {
    int                                                                          version;
    const void *                                                                 clientInfo;
} WKPageContextMenuClientBase;

typedef struct WKPageContextMenuClientV0 {
    WKPageContextMenuClientBase                                                  base;

    // Version 0.
    WKPageGetContextMenuFromProposedContextMenuCallback_deprecatedForUseWithV0   getContextMenuFromProposedMenu_deprecatedForUseWithV0;
    WKPageCustomContextMenuItemSelectedCallback                                  customContextMenuItemSelected;
} WKPageContextMenuClientV0;

typedef struct WKPageContextMenuClientV1 {
    WKPageContextMenuClientBase                                                  base;

    // Version 0.
    WKPageGetContextMenuFromProposedContextMenuCallback_deprecatedForUseWithV0   getContextMenuFromProposedMenu_deprecatedForUseWithV0;
    WKPageCustomContextMenuItemSelectedCallback                                  customContextMenuItemSelected;

    // Version 1.
    WKPageContextMenuDismissedCallback                                           contextMenuDismissed;
} WKPageContextMenuClientV1;

typedef struct WKPageContextMenuClientV2 {
    WKPageContextMenuClientBase                                                  base;

    // Version 0.
    WKPageGetContextMenuFromProposedContextMenuCallback_deprecatedForUseWithV0   getContextMenuFromProposedMenu_deprecatedForUseWithV0;
    WKPageCustomContextMenuItemSelectedCallback                                  customContextMenuItemSelected;

    // Version 1.
    WKPageContextMenuDismissedCallback                                           contextMenuDismissed;

    // Version 2.
    WKPageGetContextMenuFromProposedContextMenuCallback                          getContextMenuFromProposedMenu;
} WKPageContextMenuClientV2;

typedef struct WKPageContextMenuClientV3 {
    WKPageContextMenuClientBase                                                  base;

    // Version 0.
    WKPageGetContextMenuFromProposedContextMenuCallback_deprecatedForUseWithV0   getContextMenuFromProposedMenu_deprecatedForUseWithV0;
    WKPageCustomContextMenuItemSelectedCallback                                  customContextMenuItemSelected;

    // Version 1.
    WKPageContextMenuDismissedCallback                                           contextMenuDismissed;

    // Version 2.
    WKPageGetContextMenuFromProposedContextMenuCallback                          getContextMenuFromProposedMenu;

    // Version 3.
    WKPageShowContextMenuCallback                                                showContextMenu;
    WKPageHideContextMenuCallback                                                hideContextMenu;
} WKPageContextMenuClientV3;

typedef struct WKPageContextMenuClientV4 {
    WKPageContextMenuClientBase                                                  base;

    // Version 0.
    WKPageGetContextMenuFromProposedContextMenuCallback_deprecatedForUseWithV0   getContextMenuFromProposedMenu_deprecatedForUseWithV0;
    WKPageCustomContextMenuItemSelectedCallback                                  customContextMenuItemSelected;

    // Version 1.
    WKPageContextMenuDismissedCallback                                           contextMenuDismissed;

    // Version 2.
    WKPageGetContextMenuFromProposedContextMenuCallback                          getContextMenuFromProposedMenu;

    // Version 3.
    WKPageShowContextMenuCallback                                                showContextMenu;
    WKPageHideContextMenuCallback                                                hideContextMenu;

    // Version 4.
    WKPageGetContextMenuFromProposedContextMenuCallbackAsync                     getContextMenuFromProposedMenuAsync;

} WKPageContextMenuClientV4;

#ifdef __cplusplus
}
#endif


#endif // WKPageContextMenuClient_h
