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
class LayoutChildIterator : public LayoutIterator<T> {
public:
    LayoutChildIterator(const ElementBox& parent);
    LayoutChildIterator(const ElementBox& parent, const T* current);
    LayoutChildIterator& operator++();
};

template <typename T>
class LayoutChildIteratorAdapter {
public:
    LayoutChildIteratorAdapter(const ElementBox& parent);
    LayoutChildIterator<T> begin() const;
    LayoutChildIterator<T> end() const;
    const T* first() const;
    const T* last() const;

private:
    const ElementBox& m_parent;
};

template <typename T> LayoutChildIteratorAdapter<T> childrenOfType(const ElementBox&);

// LayoutChildIterator

template <typename T>
inline LayoutChildIterator<T>::LayoutChildIterator(const ElementBox& parent)
    : LayoutIterator<T>(&parent)
{
}

template <typename T>
inline LayoutChildIterator<T>::LayoutChildIterator(const ElementBox& parent, const T* current)
    : LayoutIterator<T>(&parent, current)
{
}

template <typename T>
inline LayoutChildIterator<T>& LayoutChildIterator<T>::operator++()
{
    return static_cast<LayoutChildIterator<T>&>(LayoutIterator<T>::traverseNextSibling());
}

// LayoutChildIteratorAdapter

template <typename T>
inline LayoutChildIteratorAdapter<T>::LayoutChildIteratorAdapter(const ElementBox& parent)
    : m_parent(parent)
{
}

template <typename T>
inline LayoutChildIterator<T> LayoutChildIteratorAdapter<T>::begin() const
{
    return LayoutChildIterator<T>(m_parent, Traversal::firstChild<T>(m_parent));
}

template <typename T>
inline LayoutChildIterator<T> LayoutChildIteratorAdapter<T>::end() const
{
    return LayoutChildIterator<T>(m_parent);
}

template <typename T>
inline const T* LayoutChildIteratorAdapter<T>::first() const
{
    return Traversal::firstChild<T>(m_parent);
}

template <typename T>
inline LayoutChildIteratorAdapter<T> childrenOfType(const ElementBox& parent)
{
    return LayoutChildIteratorAdapter<T>(parent);
}

}
}
