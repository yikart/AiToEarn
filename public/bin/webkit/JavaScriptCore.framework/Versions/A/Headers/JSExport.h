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

#ifndef JSExport_h
#define JSExport_h

#include <JavaScriptCore/JavaScriptCore.h>

#if defined(__OBJC__) && JSC_OBJC_API_ENABLED

/*!
@protocol
@abstract JSExport provides a declarative way to export Objective-C objects and
 classes -- including properties, instance methods, class methods, and
 initializers -- to JavaScript.

@discussion When an Objective-C object is exported to JavaScript, a JavaScript
 wrapper object is created.

 In JavaScript, inheritance works via a chain of prototype objects.
 For each Objective-C class in each JSContext, an object appropriate for use
 as a prototype will be provided. For the class NSObject the prototype
 will be the Object prototype. For all other Objective-C
 classes a prototype will be created. The prototype for a given
 Objective-C class will have its internal [Prototype] property set to point to
 the prototype created for the Objective-C class's superclass. As such the
 prototype chain for a JavaScript wrapper object will reflect the wrapped
 Objective-C type's inheritance hierarchy.

 JavaScriptCore also produces a constructor for each Objective-C class. The
 constructor has a property named 'prototype' that references the prototype,
 and the prototype has a property named 'constructor' that references the
 constructor.

 By default JavaScriptCore does not export any methods or properties from an
 Objective-C class to JavaScript; however methods and properties may be exported
 explicitly using JSExport. For each protocol that a class conforms to, if the
 protocol incorporates the protocol JSExport, JavaScriptCore exports the methods
 and properties in that protocol to JavaScript

 For each exported instance method JavaScriptCore will assign a corresponding
 JavaScript function to the prototype. For each exported Objective-C property
 JavaScriptCore will assign a corresponding JavaScript accessor to the prototype.
 For each exported class method JavaScriptCore will assign a corresponding
 JavaScript function to the constructor. For example:

<pre>
@textblock
    @protocol MyClassJavaScriptMethods <JSExport>
    - (void)foo;
    @end

    @interface MyClass : NSObject <MyClassJavaScriptMethods>
    - (void)foo;
    - (void)bar;
    @end
@/textblock
</pre>

 Data properties that are created on the prototype or constructor objects have
 the attributes: <code>writable:true</code>, <code>enumerable:false</code>, <code>configurable:true</code>. 
 Accessor properties have the attributes: <code>enumerable:false</code> and <code>configurable:true</code>.

 If an instance of <code>MyClass</code> is converted to a JavaScript value, the resulting
 wrapper object will (via its prototype) export the method <code>foo</code> to JavaScript,
 since the class conforms to the <code>MyClassJavaScriptMethods</code> protocol, and this
 protocol incorporates <code>JSExport</code>. <code>bar</code> will not be exported.

 JSExport supports properties, arguments, and return values of the following types:

 Primitive numbers: signed values up to 32-bits convert using JSValue's
 valueWithInt32/toInt32. Unsigned values up to 32-bits convert using JSValue's
 valueWithUInt32/toUInt32. All other numeric values convert using JSValue's
 valueWithDouble/toDouble.

 BOOL: values convert using JSValue's valueWithBool/toBool.

 id: values convert using JSValue's valueWithObject/toObject.

 Objective-C instance pointers: Pointers convert using JSValue's
 valueWithObjectOfClass/toObject.

 C structs: C structs for CGPoint, NSRange, CGRect, and CGSize convert using
 JSValue's appropriate methods. Other C structs are not supported.

 Blocks: Blocks convert using JSValue's valueWithObject/toObject.

 All objects that conform to JSExport convert to JavaScript wrapper objects,
 even if they subclass classes that would otherwise behave differently. For
 example, if a subclass of NSString conforms to JSExport, it converts to
 JavaScript as a wrapper object rather than a JavaScript string.
*/
@protocol JSExport
@end

/*!
@define
@abstract Rename a selector when it's exported to JavaScript.
@discussion When a selector that takes one or more arguments is converted to a JavaScript
 property name, by default a property name will be generated by performing the
 following conversion:

  - All colons are removed from the selector

  - Any lowercase letter that had followed a colon will be capitalized.

 Under the default conversion a selector <code>doFoo:withBar:</code> will be exported as
 <code>doFooWithBar</code>. The default conversion may be overridden using the JSExportAs
 macro, for example to export a method <code>doFoo:withBar:</code> as <code>doFoo</code>:

<pre>
@textblock
    @protocol MyClassJavaScriptMethods <JSExport>
    JSExportAs(doFoo,
    - (void)doFoo:(id)foo withBar:(id)bar
    );
    @end
@/textblock
</pre>

 Note that the JSExport macro may only be applied to a selector that takes one
 or more argument.
*/
#define JSExportAs(PropertyName, Selector) \
    @optional Selector __JS_EXPORT_AS__##PropertyName:(id)argument; @required Selector

#endif

#endif /* JSExport_h */
