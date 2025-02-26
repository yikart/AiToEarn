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

#ifndef WKPageFindMatchesClient_h
#define WKPageFindMatchesClient_h

#include <WebKit/WKBase.h>

#ifdef __cplusplus
extern "C" {
#endif

enum {
    kWKMoreThanMaximumMatchCount = -1
};

// Find match client.
typedef void (*WKPageDidFindStringMatchesCallback)(WKPageRef page, WKStringRef string, WKArrayRef matches, int firstIndex, const void* clientInfo);
typedef void (*WKPageDidGetImageForMatchResultCallback)(WKPageRef page, WKImageRef image, uint32_t index, const void* clientInfo);

typedef struct WKPageFindMatchesClientBase {
    int                                                                 version;
    const void *                                                        clientInfo;
} WKPageFindMatchesClientBase;

typedef struct WKPageFindMatchesClientV0 {
    WKPageFindMatchesClientBase                                         base;

    // Version 0.
    WKPageDidFindStringMatchesCallback                                  didFindStringMatches;
    WKPageDidGetImageForMatchResultCallback                             didGetImageForMatchResult;
} WKPageFindMatchesClientV0;

#ifdef __cplusplus
}
#endif


#endif // WKPageFindMatchesClient_h
