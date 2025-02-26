/*
 * Copyright (C) 2008 Apple Inc.  All rights reserved.
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

#ifndef JSBasePrivate_h
#define JSBasePrivate_h

#include <JavaScriptCore/JSBase.h>
#include <JavaScriptCore/WebKitAvailability.h>

#ifdef __cplusplus
extern "C" {
#endif

/*!
@function
@abstract Reports an object's non-GC memory payload to the garbage collector.
@param ctx The execution context to use.
@param size The payload's size, in bytes.
@discussion Use this function to notify the garbage collector that a GC object
owns a large non-GC memory region. Calling this function will encourage the
garbage collector to collect soon, hoping to reclaim that large non-GC memory
region.
*/
JS_EXPORT void JSReportExtraMemoryCost(JSContextRef ctx, size_t size) JSC_API_AVAILABLE(macos(10.6), ios(7.0));

JS_EXPORT void JSDisableGCTimer(void);

#if !defined(__APPLE__) && !defined(WIN32) && !defined(_WIN32)
/*!
@function JSConfigureSignalForGC
@abstract Configure signals for GC in non-Apple and non-Windows platforms.
@param signal The signal number to use.
@result true if the signal is successfully configured, otherwise false.
@discussion Call this function before any of JSC initialization starts. Otherwise, it fails.
*/
JS_EXPORT bool JSConfigureSignalForGC(int signal);
#endif

/*!
@function
@abstract Produces an object with various statistics about current memory usage.
@param ctx The execution context to use.
@result An object containing GC heap status data.
@discussion Specifically, the result object has the following integer-valued fields:
 heapSize: current size of heap
 heapCapacity: current capacity of heap
 extraMemorySize: amount of non-GC memory referenced by GC objects (included in heap size / capacity)
 objectCount: current count of GC objects
 protectedObjectCount: current count of protected GC objects
 globalObjectCount: current count of global GC objects
 protectedGlobalObjectCount: current count of protected global GC objects
 objectTypeCounts: object with GC object types as keys and their current counts as values
*/
JS_EXPORT JSObjectRef JSGetMemoryUsageStatistics(JSContextRef ctx);

#ifdef __cplusplus
}
#endif

#endif /* JSBasePrivate_h */
