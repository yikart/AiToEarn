/*
 * Copyright (C) 2013-2017 Apple Inc. All rights reserved.
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

#pragma once

#include <functional>
#include <wtf/Deque.h>
#include <wtf/Forward.h>
#include <wtf/TZoneMallocInlines.h>

WTF_ALLOW_UNSAFE_BUFFER_USAGE_BEGIN

namespace WebCore {

class SharedBuffer;

class KeyedDecoder {
    WTF_MAKE_TZONE_ALLOCATED_INLINE(KeyedDecoder);
public:
    WEBCORE_EXPORT static std::unique_ptr<KeyedDecoder> decoder(std::span<const uint8_t> data);

    virtual ~KeyedDecoder() = default;

    virtual WARN_UNUSED_RETURN bool decodeBytes(const String& key, std::span<const uint8_t>&) = 0;
    virtual WARN_UNUSED_RETURN bool decodeBool(const String& key, bool&) = 0;
    virtual WARN_UNUSED_RETURN bool decodeUInt32(const String& key, uint32_t&) = 0;
    virtual WARN_UNUSED_RETURN bool decodeUInt64(const String& key, uint64_t&) = 0;
    virtual WARN_UNUSED_RETURN bool decodeInt32(const String& key, int32_t&) = 0;
    virtual WARN_UNUSED_RETURN bool decodeInt64(const String& key, int64_t&) = 0;
    virtual WARN_UNUSED_RETURN bool decodeFloat(const String& key, float&) = 0;
    virtual WARN_UNUSED_RETURN bool decodeDouble(const String& key, double&) = 0;
    virtual WARN_UNUSED_RETURN bool decodeString(const String& key, String&) = 0;

    template<typename T> WARN_UNUSED_RETURN
    bool decodeBytes(const String& key, Vector<T>& vector)
    {
        static_assert(sizeof(T) == 1);

        std::span<const uint8_t> bytes;
        if (!decodeBytes(key, bytes))
            return false;

        vector = bytes;
        return true;
    }

    template<typename T, typename F> WARN_UNUSED_RETURN
    bool decodeEnum(const String& key, T& value, F&& isValidEnumFunction)
    {
        static_assert(std::is_enum<T>::value, "T must be an enum type");

        int64_t intValue;
        if (!decodeInt64(key, intValue))
            return false;

        if (!isValidEnumFunction(static_cast<T>(intValue)))
            return false;

        value = static_cast<T>(intValue);
        return true;
    }

    template<typename T, typename F> WARN_UNUSED_RETURN
    bool decodeObject(const String& key, T& object, F&& function)
    {
        if (!beginObject(key))
            return false;
        bool result = function(*this, object);
        endObject();
        return result;
    }

    template<typename T, typename F> WARN_UNUSED_RETURN
    bool decodeConditionalObject(const String& key, T& object, F&& function)
    {
        // FIXME: beginObject can return false for two reasons: either the
        // key doesn't exist or the key refers to something that isn't an object.
        // Because of this, decodeConditionalObject won't distinguish between a
        // missing object or a value that isn't an object.
        if (!beginObject(key))
            return true;

        bool result = function(*this, object);
        endObject();
        return result;
    }

    template<typename ContainerType, typename F> WARN_UNUSED_RETURN
    bool decodeObjects(const String& key, ContainerType& objects, F&& function)
    {
        if (!beginArray(key))
            return false;

        bool result = true;
        while (beginArrayElement()) {
            typename ContainerType::ValueType element;
            if (!function(*this, element)) {
                result = false;
                endArrayElement();
                break;
            }
            objects.append(WTFMove(element));
            endArrayElement();
        }

        endArray();
        return result;
    }

protected:
    KeyedDecoder()
    {
    }

private:
    virtual bool beginObject(const String& key) = 0;
    virtual void endObject() = 0;

    virtual bool beginArray(const String& key) = 0;
    virtual bool beginArrayElement() = 0;
    virtual void endArrayElement() = 0;
    virtual void endArray() = 0;
};

class KeyedEncoder {
    WTF_MAKE_TZONE_ALLOCATED_INLINE(KeyedEncoder);
public:
    WEBCORE_EXPORT static std::unique_ptr<KeyedEncoder> encoder();

    virtual ~KeyedEncoder() = default;

    virtual void encodeBytes(const String& key, std::span<const uint8_t>) = 0;
    virtual void encodeBool(const String& key, bool) = 0;
    virtual void encodeUInt32(const String& key, uint32_t) = 0;
    virtual void encodeUInt64(const String& key, uint64_t) = 0;
    virtual void encodeInt32(const String& key, int32_t) = 0;
    virtual void encodeInt64(const String& key, int64_t) = 0;
    virtual void encodeFloat(const String& key, float) = 0;
    virtual void encodeDouble(const String& key, double) = 0;
    virtual void encodeString(const String& key, const String&) = 0;

    virtual RefPtr<SharedBuffer> finishEncoding() = 0;

    template<typename T>
    void encodeEnum(const String& key, T value)
    {
        static_assert(std::is_enum<T>::value, "T must be an enum type");

        encodeInt64(key, static_cast<int64_t>(value));
    }

    template<typename T, typename F>
    void encodeObject(const String& key, const T& object, F&& function)
    {
        beginObject(key);
        function(*this, object);
        endObject();
    }

    template<typename T, typename F>
    void encodeConditionalObject(const String& key, const T* object, F&& function)
    {
        if (!object)
            return;

        encodeObject(key, *object, std::forward<F>(function));
    }

    template<typename T, typename F>
    void encodeObjects(const String& key, T begin, T end, F&& function)
    {
        beginArray(key);
        for (T it = begin; it != end; ++it) {
            beginArrayElement();
            function(*this, *it);
            endArrayElement();
        }
        endArray();
    }

protected:
    KeyedEncoder()
    {
    }

private:
    virtual void beginObject(const String& key) = 0;
    virtual void endObject() = 0;

    virtual void beginArray(const String& key) = 0;
    virtual void beginArrayElement() = 0;
    virtual void endArrayElement() = 0;
    virtual void endArray() = 0;
};

} // namespace WebCore

WTF_ALLOW_UNSAFE_BUFFER_USAGE_END
