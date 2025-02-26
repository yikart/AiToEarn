/*
 * Copyright (C) 2018 Apple Inc. All rights reserved.
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

#include "LayoutIterator.h"

namespace WebCore {
namespace Layout {

template <typename T>
class LayoutDescendantIterator : public LayoutIterator<T> {
public:
    LayoutDescendantIterator(const ElementBox& root);
    LayoutDescendantIterator(const ElementBox& root, const T* current);
    LayoutDescendantIterator& operator++();
};

template <typename T>
class LayoutDescendantIteratorAdapter {
public:
    LayoutDescendantIteratorAdapter(const ElementBox& root);
    LayoutDescendantIterator<T> begin();
    LayoutDescendantIterator<T> end();
    LayoutDescendantIterator<T> at(const T&);

private:
    const ElementBox& m_root;
};

template <typename T> LayoutDescendantIteratorAdapter<T> descendantsOfType(const Box&);

// LayoutDescendantIterator

template <typename T>
inline LayoutDescendantIterator<T>::LayoutDescendantIterator(const ElementBox& root)
    : LayoutIterator<T>(&root)
{
}

template <typename T>
inline LayoutDescendantIterator<T>::LayoutDescendantIterator(const ElementBox& root, const T* current)
    : LayoutIterator<T>(&root, current)
{
}

template <typename T>
inline LayoutDescendantIterator<T>& LayoutDescendantIterator<T>::operator++()
{
    return static_cast<LayoutDescendantIterator<T>&>(LayoutIterator<T>::traverseNext());
}

// LayoutDescendantIteratorAdapter

template <typename T>
inline LayoutDescendantIteratorAdapter<T>::LayoutDescendantIteratorAdapter(const ElementBox& root)
    : m_root(root)
{
}

template <typename T>
inline LayoutDescendantIterator<T> LayoutDescendantIteratorAdapter<T>::begin()
{
    return LayoutDescendantIterator<T>(m_root, Traversal::firstWithin<T>(m_root));
}

template <typename T>
inline LayoutDescendantIterator<T> LayoutDescendantIteratorAdapter<T>::end()
{
    return LayoutDescendantIterator<T>(m_root);
}

template <typename T>
inline LayoutDescendantIterator<T> LayoutDescendantIteratorAdapter<T>::at(const T& current)
{
    return LayoutDescendantIterator<T>(m_root, &current);
}

// Standalone functions

template <typename T>
inline LayoutDescendantIteratorAdapter<T> descendantsOfType(const ElementBox& root)
{
    return LayoutDescendantIteratorAdapter<T>(root);
}

}
}
