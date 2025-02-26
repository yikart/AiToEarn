/*
 * Copyright (C) 2022 Apple Inc. All rights reserved.
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

#ifndef JSIntegrityPrivate_h
#define JSIntegrityPrivate_h

#include <JavaScriptCore/JSContextRef.h>
#include <JavaScriptCore/JSObjectRef.h>
#include <JavaScriptCore/JSValueRef.h>

#ifdef __cplusplus
extern "C" {
#endif

/*!
@function
@abstract Audits the integrity of the JSContextRef.
@param ctx The JSContext you want to audit.
@result JSContextRef that was passed in.
@discussion This function will crash if the audit detects any errors.
 */
JS_EXPORT JSContextRef jsAuditJSContextRef(JSContextRef ctx) JSC_API_AVAILABLE(macos(13.0), ios(16.1));

/*!
@function
@abstract Audits the integrity of the JSGlobalContextRef.
@param ctx The JSGlobalContextRef you want to audit.
@result JSGlobalContextRef that was passed in.
@discussion This function will crash if the audit detects any errors.
 */
JS_EXPORT JSGlobalContextRef jsAuditJSGlobalContextRef(JSGlobalContextRef ctx) JSC_API_AVAILABLE(macos(13.0), ios(16.1));

/*!
@function
@abstract Audits the integrity of the JSObjectRef.
@param obj The JSObjectRef you want to audit.
@result JSObjectRef that was passed in.
@discussion This function will crash if the audit detects any errors.
 */
JS_EXPORT JSObjectRef jsAuditJSObjectRef(JSObjectRef obj) JSC_API_AVAILABLE(macos(13.0), ios(16.1));

/*!
@function
@abstract Audits the integrity of the JSValueRef.
@param value The JSValueRef you want to audit.
@result JSValueRef that was passed in.
@discussion This function will crash if the audit detects any errors.
 */
JS_EXPORT JSValueRef jsAuditJSValueRef(JSValueRef value) JSC_API_AVAILABLE(macos(13.0), ios(16.1));

#ifdef __cplusplus
}
#endif

#endif /* JSIntegrityPrivate_h */
