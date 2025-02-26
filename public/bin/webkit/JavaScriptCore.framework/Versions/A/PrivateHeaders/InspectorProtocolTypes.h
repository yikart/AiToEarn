/*
 * Copyright (C) 2013 Apple Inc. All Rights Reserved.
 * Copyright (C) 2011 The Chromium Authors. All rights reserved.
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

#include <wtf/Assertions.h>
#include <wtf/Expected.h>
#include <wtf/JSONValues.h>
#include <wtf/text/WTFString.h>

namespace Inspector {

namespace Protocol {

using ErrorString = String;

template <typename T>
using ErrorStringOr = Expected<T, ErrorString>;

template<typename> struct BindingTraits;

template<JSON::Value::Type type> struct PrimitiveBindingTraits {
    static void assertValueHasExpectedType(JSON::Value* value)
    {
        ASSERT_UNUSED(value, value);
        ASSERT_UNUSED(value, value->type() == type);
    }
};

template<typename T> struct BindingTraits<JSON::ArrayOf<T>> {
    static Ref<JSON::ArrayOf<T>> runtimeCast(Ref<JSON::Value>&& value)
    {
        auto array = value->asArray();
        BindingTraits<JSON::ArrayOf<T>>::assertValueHasExpectedType(array.get());
        static_assert(sizeof(JSON::ArrayOf<T>) == sizeof(JSON::Array), "type cast problem");
        return static_reference_cast<JSON::ArrayOf<T>>(static_reference_cast<JSON::ArrayBase>(array.releaseNonNull()));
    }

    static void assertValueHasExpectedType(JSON::Value* value)
    {
        ASSERT_UNUSED(value, value);
#if ASSERT_ENABLED
        auto array = value->asArray();
        ASSERT(array);
        for (unsigned i = 0; i < array->length(); i++)
            BindingTraits<T>::assertValueHasExpectedType(array->get(i).ptr());
#endif
    }
};

template<> struct BindingTraits<JSON::Value> {
    static void assertValueHasExpectedType(JSON::Value*)
    {
    }
};

template<> struct BindingTraits<JSON::Array> : PrimitiveBindingTraits<JSON::Value::Type::Array> { };
template<> struct BindingTraits<JSON::Object> : PrimitiveBindingTraits<JSON::Value::Type::Object> { };
template<> struct BindingTraits<String> : PrimitiveBindingTraits<JSON::Value::Type::String> { };
template<> struct BindingTraits<bool> : PrimitiveBindingTraits<JSON::Value::Type::Boolean> { };
template<> struct BindingTraits<double> : PrimitiveBindingTraits<JSON::Value::Type::Double> { };
template<> struct BindingTraits<int> : PrimitiveBindingTraits<JSON::Value::Type::Integer> { };

}

} // namespace Inspector
