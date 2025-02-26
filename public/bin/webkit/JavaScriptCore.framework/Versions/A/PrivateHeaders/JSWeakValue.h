/*
 * Copyright (C) 2013, 2016 Apple Inc.  All rights reserved.
 * Copyright (C) 2018 Igalia S.L.
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

#include "JSCJSValue.h"
#include "Weak.h"

namespace JSC {

class JSObject;
class JSString;
class WeakHandleOwner;

class JSWeakValue {
public:
    JSWeakValue() = default;
    ~JSWeakValue();

    void clear();
    bool isClear() const;

    bool isSet() const { return m_tag != WeakTypeTag::NotSet; }
    bool isPrimitive() const { return m_tag == WeakTypeTag::Primitive; }
    bool isObject() const { return m_tag == WeakTypeTag::Object; }
    bool isString() const { return m_tag == WeakTypeTag::String; }

    void setPrimitive(JSValue);
    void setObject(JSObject*, WeakHandleOwner&, void* context);
    void setString(JSString*, WeakHandleOwner&, void* context);

    JSObject* object() const
    {
        ASSERT(isObject());
        return m_value.object.get();
    }

    JSValue primitive() const
    {
        ASSERT(isPrimitive());
        return m_value.primitive;
    }

    JSString* string() const
    {
        ASSERT(isString());
        return m_value.string.get();
    }

private:
    enum class WeakTypeTag { NotSet, Primitive, Object, String };

    WeakTypeTag m_tag { WeakTypeTag::NotSet };

    union WeakValueUnion {
        WeakValueUnion()
            : primitive(JSValue())
        {
        }

        ~WeakValueUnion()
        {
            ASSERT(!primitive);
        }

        JSValue primitive;
        Weak<JSObject> object;
        Weak<JSString> string;
    } m_value;
};

} // namespace JSC
