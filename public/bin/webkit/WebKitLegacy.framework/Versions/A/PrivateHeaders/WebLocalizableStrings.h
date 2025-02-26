/*
 * Copyright (C) 2005-2020 Apple Inc. All rights reserved.
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

#ifdef __OBJC__
#import <Foundation/Foundation.h>
typedef NSString *WebLocalizedStringType;
#else
#ifdef __cplusplus
class NSBundle;
#else
typedef struct NSBundle NSBundle;
#endif
typedef CFStringRef WebLocalizedStringType;
#endif

typedef struct {
    const char *identifier;
    __unsafe_unretained NSBundle *bundle;
} WebLocalizableStringsBundle;

#ifdef __cplusplus
extern "C" {
#endif

WebLocalizedStringType WebLocalizedString(WebLocalizableStringsBundle* bundle, const char* key);

#ifdef __cplusplus
}
#endif

static inline __attribute__((format_arg(3))) WebLocalizedStringType WebLocalizedStringWithValue(WebLocalizableStringsBundle* bundle, const char* key, const char* value)
{
    return WebLocalizedString(bundle, key);
}

#ifdef FRAMEWORK_NAME

#define LOCALIZABLE_STRINGS_BUNDLE(F) LOCALIZABLE_STRINGS_BUNDLE_HELPER(F)
#define LOCALIZABLE_STRINGS_BUNDLE_HELPER(F) F ## LocalizableStringsBundle

__attribute__((visibility("hidden")))
extern WebLocalizableStringsBundle LOCALIZABLE_STRINGS_BUNDLE(FRAMEWORK_NAME);

#define UI_STRING(string, comment) WebLocalizedStringWithValue(&LOCALIZABLE_STRINGS_BUNDLE(FRAMEWORK_NAME), string, string)
#define UI_STRING_KEY(string, key, comment) WebLocalizedStringWithValue(&LOCALIZABLE_STRINGS_BUNDLE(FRAMEWORK_NAME), key, string)

#else

#define UI_STRING(string, comment) WebLocalizedStringWithValue(0, string, string)
#define UI_STRING_KEY(string, key, comment) WebLocalizedStringWithValue(0, key, string)

#endif
