/*
 * Copyright (C) 2022-2024 Apple Inc. All rights reserved.
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

#import <WebKit/WKWebExtensionContextPrivate.h>

#define HAVE_WK_WEB_EXTENSION_CONTEXT_ARRAY_BASED_DID_SELECT_TABS 1

WK_EXTERN
@interface _WKWebExtensionContext : WKWebExtensionContext
@end

#define _WKWebExtensionContext WKWebExtensionContext

#define _WKWebExtensionContextPermissionStatus WKWebExtensionContextPermissionStatus
#define _WKWebExtensionContextPermissionStatusDeniedExplicitly WKWebExtensionContextPermissionStatusDeniedExplicitly
#define _WKWebExtensionContextPermissionStatusDeniedImplicitly WKWebExtensionContextPermissionStatusDeniedImplicitly
#define _WKWebExtensionContextPermissionStatusRequestedImplicitly WKWebExtensionContextPermissionStatusRequestedImplicitly
#define _WKWebExtensionContextPermissionStatusUnknown WKWebExtensionContextPermissionStatusUnknown
#define _WKWebExtensionContextPermissionStatusRequestedExplicitly WKWebExtensionContextPermissionStatusRequestedExplicitly
#define _WKWebExtensionContextPermissionStatusGrantedImplicitly WKWebExtensionContextPermissionStatusGrantedImplicitly
#define _WKWebExtensionContextPermissionStatusGrantedExplicitly WKWebExtensionContextPermissionStatusGrantedExplicitly

#define _WKWebExtensionPermission WKWebExtensionPermission

WK_EXTERN NSErrorDomain const _WKWebExtensionContextErrorDomain;

WK_EXTERN NSNotificationName const _WKWebExtensionContextPermissionsWereGrantedNotification;
WK_EXTERN NSNotificationName const _WKWebExtensionContextPermissionsWereDeniedNotification;
WK_EXTERN NSNotificationName const _WKWebExtensionContextGrantedPermissionsWereRemovedNotification;
WK_EXTERN NSNotificationName const _WKWebExtensionContextDeniedPermissionsWereRemovedNotification;

WK_EXTERN NSNotificationName const _WKWebExtensionContextPermissionMatchPatternsWereGrantedNotification;
WK_EXTERN NSNotificationName const _WKWebExtensionContextPermissionMatchPatternsWereDeniedNotification;
WK_EXTERN NSNotificationName const _WKWebExtensionContextGrantedPermissionMatchPatternsWereRemovedNotification;
WK_EXTERN NSNotificationName const _WKWebExtensionContextDeniedPermissionMatchPatternsWereRemovedNotification;

WK_EXTERN NSString * const _WKWebExtensionContextNotificationUserInfoKeyPermissions;
WK_EXTERN NSString * const _WKWebExtensionContextNotificationUserInfoKeyMatchPatterns;
