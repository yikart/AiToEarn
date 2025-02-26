/*
 * Copyright (C) 2010 Apple Inc. All rights reserved.
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

#ifndef WKPageGroup_h
#define WKPageGroup_h

#include <WebKit/WKBase.h>
#include <WebKit/WKDeprecated.h>
#include <WebKit/WKUserContentInjectedFrames.h>
#include <WebKit/WKUserScriptInjectionTime.h>

#ifdef __cplusplus
extern "C" {
#endif

WK_EXPORT WKTypeID WKPageGroupGetTypeID(void) WK_C_API_DEPRECATED;

WK_EXPORT WKPageGroupRef WKPageGroupCreateWithIdentifier(WKStringRef identifier) WK_C_API_DEPRECATED;

WK_EXPORT void WKPageGroupSetPreferences(WKPageGroupRef pageGroup, WKPreferencesRef preferences) WK_C_API_DEPRECATED;
WK_EXPORT WKPreferencesRef WKPageGroupGetPreferences(WKPageGroupRef pageGroup) WK_C_API_DEPRECATED;

WK_EXPORT WKUserContentControllerRef WKPageGroupGetUserContentController(WKPageGroupRef pageGroup) WK_C_API_DEPRECATED;

WK_EXPORT void WKPageGroupAddUserStyleSheet(WKPageGroupRef pageGroup, WKStringRef source, WKURLRef baseURL, WKArrayRef allowedURLPatterns, WKArrayRef blockedURLPatterns, WKUserContentInjectedFrames) WK_C_API_DEPRECATED;
WK_EXPORT void WKPageGroupRemoveAllUserStyleSheets(WKPageGroupRef pageGroup) WK_C_API_DEPRECATED;

WK_EXPORT void WKPageGroupAddUserScript(WKPageGroupRef pageGroup, WKStringRef source, WKURLRef baseURL, WKArrayRef allowedURLPatterns, WKArrayRef blockedURLPatterns, WKUserContentInjectedFrames, _WKUserScriptInjectionTime) WK_C_API_DEPRECATED;
WK_EXPORT void WKPageGroupRemoveAllUserScripts(WKPageGroupRef pageGroup) WK_C_API_DEPRECATED;

#ifdef __cplusplus
}
#endif

#endif /* WKPageGroup_h */
