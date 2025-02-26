/*
 * Copyright (C) 2015-2023 Apple Inc.  All rights reserved.
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
 * THIS SOFTWARE IS PROVIDED BY APPLE INC. ``AS IS'' AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR
 * PURPOSE ARE DISCLAIMED.  IN NO EVENT SHALL APPLE INC. OR
 * CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
 * EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
 * PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
 * PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY
 * OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE. 
 */

#ifndef JSRemoteInspector_h
#define JSRemoteInspector_h

#include <JavaScriptCore/JSBase.h>
#include <JavaScriptCore/WebKitAvailability.h>

#if defined(WIN32) || defined(_WIN32)
#include <stdint.h>
typedef int JSProcessID;
#else
#include <unistd.h>
typedef pid_t JSProcessID;
#endif

#ifdef __cplusplus
extern "C" {
#endif

JS_EXPORT void JSRemoteInspectorDisableAutoStart(void) JSC_API_AVAILABLE(macos(10.11), ios(9.0));
JS_EXPORT void JSRemoteInspectorStart(void) JSC_API_AVAILABLE(macos(10.11), ios(9.0));
JS_EXPORT void JSRemoteInspectorSetParentProcessInformation(JSProcessID, const uint8_t* auditData, size_t auditLength) JSC_API_AVAILABLE(macos(10.11), ios(9.0));

JS_EXPORT void JSRemoteInspectorSetLogToSystemConsole(bool) JSC_API_AVAILABLE(macos(10.11), ios(9.0));

JS_EXPORT bool JSRemoteInspectorGetInspectionEnabledByDefault(void) JSC_API_AVAILABLE(macos(10.11), ios(9.0));
JS_EXPORT void JSRemoteInspectorSetInspectionEnabledByDefault(bool) JSC_API_DEPRECATED("Use JSGlobalContextSetInspectable on a single JSGlobalContextRef.", macos(10.11, 13.3), ios(9.0, 16.4));

JS_EXPORT bool JSRemoteInspectorGetInspectionFollowsInternalPolicies(void) JSC_API_AVAILABLE(macos(13.3), ios(16.4));
JS_EXPORT void JSRemoteInspectorSetInspectionFollowsInternalPolicies(bool) JSC_API_AVAILABLE(macos(13.3), ios(16.4));

#ifdef __cplusplus
}
#endif

#endif /* JSRemoteInspector_h */
