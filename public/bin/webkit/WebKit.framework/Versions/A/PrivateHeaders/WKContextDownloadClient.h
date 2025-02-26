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

#ifndef WKContextDownloadClient_h
#define WKContextDownloadClient_h

#include <WebKit/WKBase.h>

typedef void (*WKContextDownloadDidStartCallback)(WKContextRef context, WKDownloadRef download, const void *clientInfo);
typedef void (*WKContextDownloadDidReceiveAuthenticationChallengeCallback)(WKContextRef context, WKDownloadRef download, WKAuthenticationChallengeRef authenticationChallenge, const void *clientInfo);
typedef void (*WKContextDownloadDidReceiveResponseCallback)(WKContextRef context, WKDownloadRef download, WKURLResponseRef response, const void *clientInfo);
typedef void (*WKContextDownloadDidReceiveDataCallback)(WKContextRef context, WKDownloadRef download, uint64_t length, const void *clientInfo);
typedef bool (*WKContextDownloadShouldDecodeSourceDataOfMIMETypeCallback)(WKContextRef context, WKDownloadRef download, WKStringRef mimeType, const void *clientInfo);
typedef WKStringRef (*WKContextDownloadDecideDestinationWithSuggestedFilenameCallback)(WKContextRef context, WKDownloadRef download, WKStringRef filename, bool* allowOverwrite, const void *clientInfo);
typedef void (*WKContextDownloadDidCreateDestinationCallback)(WKContextRef context, WKDownloadRef download, WKStringRef path, const void *clientInfo);
typedef void (*WKContextDownloadDidFinishCallback)(WKContextRef context, WKDownloadRef download, const void *clientInfo);
typedef void (*WKContextDownloadDidFailCallback)(WKContextRef context, WKDownloadRef download, WKErrorRef error, const void *clientInfo);
typedef void (*WKContextDownloadDidCancel)(WKContextRef context, WKDownloadRef download, const void *clientInfo);
typedef void (*WKContextDownloadProcessDidCrashCallback)(WKContextRef context, WKDownloadRef download, const void *clientInfo);
typedef void (*WKContextDownloadDidReceiveServerRedirect)(WKContextRef context, WKDownloadRef download, WKURLRef url, const void *clientInfo);

typedef struct WKContextDownloadClientBase {
    int                                                                 version;
    const void *                                                        clientInfo;
} WKContextDownloadClientBase;

typedef struct WKContextDownloadClientV0 {
    WKContextDownloadClientBase                                         base;

    // Version 0.
    WKContextDownloadDidStartCallback                                   didStart;
    WKContextDownloadDidReceiveAuthenticationChallengeCallback          didReceiveAuthenticationChallenge;
    WKContextDownloadDidReceiveResponseCallback                         didReceiveResponse;
    WKContextDownloadDidReceiveDataCallback                             didReceiveData;
    WKContextDownloadShouldDecodeSourceDataOfMIMETypeCallback           shouldDecodeSourceDataOfMIMEType;
    WKContextDownloadDecideDestinationWithSuggestedFilenameCallback     decideDestinationWithSuggestedFilename;
    WKContextDownloadDidCreateDestinationCallback                       didCreateDestination;
    WKContextDownloadDidFinishCallback                                  didFinish;
    WKContextDownloadDidFailCallback                                    didFail;
    WKContextDownloadDidCancel                                          didCancel;
    WKContextDownloadProcessDidCrashCallback                            processDidCrash;
} WKContextDownloadClientV0;

typedef struct WKContextDownloadClientV1 {
    WKContextDownloadClientBase                                         base;

    // Version 0.
    WKContextDownloadDidStartCallback                                   didStart;
    WKContextDownloadDidReceiveAuthenticationChallengeCallback          didReceiveAuthenticationChallenge;
    WKContextDownloadDidReceiveResponseCallback                         didReceiveResponse;
    WKContextDownloadDidReceiveDataCallback                             didReceiveData;
    WKContextDownloadShouldDecodeSourceDataOfMIMETypeCallback           shouldDecodeSourceDataOfMIMEType;
    WKContextDownloadDecideDestinationWithSuggestedFilenameCallback     decideDestinationWithSuggestedFilename;
    WKContextDownloadDidCreateDestinationCallback                       didCreateDestination;
    WKContextDownloadDidFinishCallback                                  didFinish;
    WKContextDownloadDidFailCallback                                    didFail;
    WKContextDownloadDidCancel                                          didCancel;
    WKContextDownloadProcessDidCrashCallback                            processDidCrash;

    // Version 1.
    WKContextDownloadDidReceiveServerRedirect                           didReceiveServerRedirect;
} WKContextDownloadClientV1;

#endif // WKContextDownloadClient_h
