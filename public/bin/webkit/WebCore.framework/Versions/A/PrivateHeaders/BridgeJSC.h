/*
 * Copyright (C) 2003, 2008, 2009 Apple Inc. All rights reserved.
 * Copyright 2010, The Android Open Source Project
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

#pragma once

#include "Bridge.h"
#include <JavaScriptCore/JSString.h>
#include <wtf/RefCounted.h>
#include <wtf/TZoneMalloc.h>
#include <wtf/Vector.h>

namespace JSC  {

class ArgList;
class Identifier;
class JSGlobalObject;
class PropertyNameArray;
class RuntimeMethod;

namespace Bindings {

class Instance;
class Method;
class RootObject;
class RuntimeObject;

class Field {
    WTF_MAKE_TZONE_ALLOCATED(Field);
public:
    virtual JSValue valueFromInstance(JSGlobalObject*, const Instance*) const = 0;
    virtual bool setValueToInstance(JSGlobalObject*, const Instance*, JSValue) const = 0;

    virtual ~Field() = default;
};

class Class {
    WTF_MAKE_TZONE_ALLOCATED(Class);
    WTF_MAKE_NONCOPYABLE(Class);
public:
    Class() = default;
    virtual Method* methodNamed(PropertyName, Instance*) const = 0;
    virtual Field* fieldNamed(PropertyName, Instance*) const = 0;
    virtual JSValue fallbackObject(JSGlobalObject*, Instance*, PropertyName) { return jsUndefined(); }

    virtual ~Class() = default;
};

class Instance : public RefCounted<Instance> {
public:
    WEBCORE_EXPORT Instance(RefPtr<RootObject>&&);

    // These functions are called before and after the main entry points into
    // the native implementations.  They can be used to establish and cleanup
    // any needed state.
    void begin();
    void end();

    virtual Class* getClass() const = 0;
    WEBCORE_EXPORT JSObject* createRuntimeObject(JSGlobalObject*);
    void willInvalidateRuntimeObject();

    // Returns false if the value was not set successfully.
    virtual bool setValueOfUndefinedField(JSGlobalObject*, PropertyName, JSValue) { return false; }

    virtual JSValue getMethod(JSGlobalObject*, PropertyName) = 0;
    virtual JSValue invokeMethod(JSGlobalObject*, CallFrame*, RuntimeMethod* method) = 0;

    virtual bool supportsInvokeDefaultMethod() const { return false; }
    virtual JSValue invokeDefaultMethod(JSGlobalObject*, CallFrame*) { return jsUndefined(); }

    virtual bool supportsConstruct() const { return false; }
    virtual JSValue invokeConstruct(JSGlobalObject*, CallFrame*, const ArgList&) { return JSValue(); }

    virtual void getPropertyNames(JSGlobalObject*, PropertyNameArray&) { }

    virtual JSValue defaultValue(JSGlobalObject*, PreferredPrimitiveType) const = 0;

    virtual JSValue valueOf(JSGlobalObject* exec) const = 0;

    RootObject* rootObject() const;

    WEBCORE_EXPORT virtual ~Instance();

    virtual bool getOwnPropertySlot(JSObject*, JSGlobalObject*, PropertyName, PropertySlot&) { return false; }
    virtual bool put(JSObject*, JSGlobalObject*, PropertyName, JSValue, PutPropertySlot&) { return false; }

protected:
    virtual void virtualBegin() { }
    virtual void virtualEnd() { }
    WEBCORE_EXPORT virtual RuntimeObject* newRuntimeObject(JSGlobalObject*);

    RefPtr<RootObject> m_rootObject;

private:
    Weak<RuntimeObject> m_runtimeObject;
};

class Array {
    WTF_MAKE_NONCOPYABLE(Array);
public:
    explicit Array(RefPtr<RootObject>&&);
    virtual ~Array();

    virtual bool setValueAt(JSGlobalObject*, unsigned index, JSValue) const = 0;
    virtual JSValue valueAt(JSGlobalObject*, unsigned index) const = 0;
    virtual unsigned int getLength() const = 0;

protected:
    RefPtr<RootObject> m_rootObject;
};

const char* signatureForParameters(const ArgList&);

} // namespace Bindings

} // namespace JSC
