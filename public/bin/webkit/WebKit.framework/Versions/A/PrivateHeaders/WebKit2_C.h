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

#ifndef WebKit2_C_h
#define WebKit2_C_h

#include <WebKit/WKBase.h>
#include <WebKit/WKType.h>

#include <WebKit/WKArray.h>
#include <WebKit/WKBackForwardListRef.h>
#include <WebKit/WKBackForwardListItemRef.h>
#include <WebKit/WKContext.h>
#include <WebKit/WKData.h>
#include <WebKit/WKDictionary.h>
#include <WebKit/WKErrorRef.h>
#include <WebKit/WKFeature.h>
#include <WebKit/WKFormSubmissionListener.h>
#include <WebKit/WKFrame.h>
#include <WebKit/WKFramePolicyListener.h>
#include <WebKit/WKGeolocationManager.h>
#include <WebKit/WKGeolocationPermissionRequest.h>
#include <WebKit/WKGeolocationPosition.h>
#include <WebKit/WKHitTestResult.h>
#include <WebKit/WKMutableArray.h>
#include <WebKit/WKMutableDictionary.h>
#include <WebKit/WKNavigationDataRef.h>
#include <WebKit/WKNumber.h>
#include <WebKit/WKOpenPanelParametersRef.h>
#include <WebKit/WKOpenPanelResultListener.h>
#include <WebKit/WKPage.h>
#include <WebKit/WKPageConfigurationRef.h>
#include <WebKit/WKPageGroup.h>
#include <WebKit/WKPreferencesRef.h>
#include <WebKit/WKString.h>
#include <WebKit/WKURL.h>
#include <WebKit/WKURLRequest.h>
#include <WebKit/WKURLResponse.h>
#include <WebKit/WKUserContentControllerRef.h>
#include <WebKit/WKUserMediaPermissionRequest.h>
#include <WebKit/WKUserScriptRef.h>

#if defined(__OBJC__) && __OBJC__
#import <WebKit/WKView.h>
#elif !(defined(__APPLE__) && __APPLE__)
#include <WebKit/WKView.h>
#endif

#endif /* WebKit2_C_h */
