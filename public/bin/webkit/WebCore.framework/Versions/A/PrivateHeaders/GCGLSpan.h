/*
 * Copyright (C) 2023 Apple Inc. All rights reserved.
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

#include "GraphicsTypesGL.h"
#include <type_traits>
#include <wtf/Vector.h>

template<typename... Types>
struct GCGLSpanTuple {
    GCGLSpanTuple(Types*... dataPointers, size_t bufSize)
        : bufSize { bufSize }
        , dataTuple { dataPointers... }
    { }

    template<typename... VectorTypes>
    GCGLSpanTuple(const Vector<VectorTypes>&... dataVectors)
        : bufSize(
            [](auto& firstVector, auto&... otherVectors) {
                auto size = firstVector.size();
                RELEASE_ASSERT(((otherVectors.size() == size) && ...));
                return size;
            }(dataVectors...))
        , dataTuple { dataVectors.data()... }
    { }

    template<unsigned I>
    auto data() const
    {
        return std::get<I>(dataTuple);
    }

    const size_t bufSize;
    std::tuple<Types*...> dataTuple;
};

template<typename T0, typename T1>
GCGLSpanTuple(T0*, T1*, size_t) -> GCGLSpanTuple<T0, T1>;

template<typename T0, typename T1, typename T2>
GCGLSpanTuple(T0*, T1*, T2*, size_t) -> GCGLSpanTuple<T0, T1, T2>;

template<typename T0, typename T1, typename T2, typename T3>
GCGLSpanTuple(T0*, T1*, T2*, T3*, size_t) -> GCGLSpanTuple<T0, T1, T2, T3>;

template<typename T0, typename T1, typename T2, typename T3, typename T4>
GCGLSpanTuple(T0*, T1*, T2*, T3*, T4*, size_t) -> GCGLSpanTuple<T0, T1, T2, T3, T4>;

template<typename T0, typename T1>
GCGLSpanTuple(const Vector<T0>&, const Vector<T1>&) -> GCGLSpanTuple<const T0, const T1>;

template<typename T0, typename T1, typename T2>
GCGLSpanTuple(const Vector<T0>&, const Vector<T1>&, const Vector<T2>&) -> GCGLSpanTuple<const T0, const T1, const T2>;

template<typename T0, typename T1, typename T2, typename T3>
GCGLSpanTuple(const Vector<T0>&, const Vector<T1>&, const Vector<T2>&, const Vector<T3>&) -> GCGLSpanTuple<const T0, const T1, const T2, const T3>;

template<typename T0, typename T1, typename T2, typename T3, typename T4>
GCGLSpanTuple(const Vector<T0>&, const Vector<T1>&, const Vector<T2>&, const Vector<T3>&, const Vector<T4>&) -> GCGLSpanTuple<const T0, const T1, const T2, const T3, const T4>;
