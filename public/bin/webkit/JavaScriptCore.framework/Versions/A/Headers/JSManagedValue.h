/*
 * Copyright (C) 2013-2024 Apple Inc. All rights reserved.
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

#ifndef JSManagedValue_h
#define JSManagedValue_h

#include <JavaScriptCore/JSBase.h>
#include <JavaScriptCore/WebKitAvailability.h>

#if defined(__OBJC__) && JSC_OBJC_API_ENABLED

@class JSValue;
@class JSContext;

/*!
@interface
@discussion JSManagedValue represents a "conditionally retained" JSValue. 
 "Conditionally retained" means that as long as the JSManagedValue's 
 JSValue is reachable through the JavaScript object graph,
 or through the Objective-C object graph reported to the JSVirtualMachine using
 addManagedReference:withOwner:, the corresponding JSValue will 
 be retained. However, if neither graph reaches the JSManagedValue, the 
 corresponding JSValue will be released and set to nil.

The primary use for a JSManagedValue is to store a JSValue in an Objective-C
or Swift object that is exported to JavaScript. It is incorrect to store a JSValue
in an object that is exported to JavaScript, since doing so creates a retain cycle.
*/ 
NS_CLASS_AVAILABLE(10_9, 7_0)
@interface JSManagedValue : NSObject

/*!
@method
@abstract Create a JSManagedValue from a JSValue.
@result The new JSManagedValue.
*/
+ (JSManagedValue *)managedValueWithValue:(JSValue *)value;
+ (JSManagedValue *)managedValueWithValue:(JSValue *)value andOwner:(id)owner JSC_API_AVAILABLE(macos(10.10), ios(8.0));

/*!
@method
@abstract Create a JSManagedValue.
@result The new JSManagedValue.
*/
- (instancetype)initWithValue:(JSValue *)value;

/*!
@property
@abstract Get the JSValue from the JSManagedValue.
@result The corresponding JSValue for this JSManagedValue or 
 nil if the JSValue has been collected.
*/
@property (readonly, strong) JSValue *value;

@end

#endif

#endif /* JSManagedValue_h */
