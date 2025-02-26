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

#include "LayoutInitialContainingBlock.h"

namespace WebCore {
namespace Layout {

template <typename T>
class LayoutIterator {
public:
    LayoutIterator(const ElementBox* root);
    LayoutIterator(const ElementBox* root, const T* current);

    const T& get() const;

    const T& operator*() const;
    const T* operator->() const;

    bool operator==(const LayoutIterator& other) const;

    LayoutIterator& traverseNext();
    LayoutIterator& traverseNextSkippingChildren();
    LayoutIterator& traverseNextSibling();

private:
    const ElementBox* m_root;
    const T* m_current;
};

// Similar to WTF::is<>() but without the static_assert() making sure the check is necessary.
template <typename T, typename U>
inline bool isLayoutBoxOfType(const U& layoutBox) { return TypeCastTraits<const T, const U>::isOfType(layoutBox); }

namespace LayoutBoxTraversal {

template <typename U>
inline const Box* firstChild(U& object)
{
    return object.firstChild();
}

inline const Box* firstChild(const Box& box)
{
    if (auto* elementBox = dynamicDowncast<ElementBox>(box))
        return elementBox->firstChild();
    return nullptr;
}

inline const Box* nextAncestorSibling(const Box& current, const ElementBox& stayWithin)
{
    for (auto* ancestor = &current.parent(); !is<InitialContainingBlock>(*ancestor); ancestor = &ancestor->parent()) {
        if (ancestor == &stayWithin)
            return nullptr;
        if (auto* sibling = ancestor->nextSibling())
            return sibling;
    }
    return nullptr;
}

template <typename U>
inline const Box* next(const U& current, const ElementBox& stayWithin)
{
    if (auto* child = firstChild(current))
        return child;

    if (&current == &stayWithin)
        return nullptr;

    if (auto* sibling = current.nextSibling())
        return sibling;

    return nextAncestorSibling(current, stayWithin);
}

template <typename U>
inline const Box* nextSkippingChildren(const U& current, const ElementBox& stayWithin)
{
    if (&current == &stayWithin)
        return nullptr;

    if (auto* sibling = current.nextSibling())
        return sibling;

    return nextAncestorSibling(current, stayWithin);
}

}
// Traversal helpers
namespace Traversal {

template <typename T, typename U>
inline const T* firstChild(U& current)
{
    auto* object = LayoutBoxTraversal::firstChild(current);
    while (object && !isLayoutBoxOfType<T>(*object))
        object = object->nextSibling();
    return static_cast<const T*>(object);
}

template <typename T>
inline const T* nextSibling(const T& current)
{
    auto* object = current.nextSibling();
    while (object && !isLayoutBoxOfType<T>(*object))
        object = object->nextSibling();
    return static_cast<const T*>(object);
}

template <typename T, typename U>
inline const T* firstWithin(const U& stayWithin)
{
    auto* descendant = LayoutBoxTraversal::firstChild(stayWithin);
    while (descendant && !isLayoutBoxOfType<T>(*descendant))
        descendant = LayoutBoxTraversal::next(*descendant, stayWithin);
    return static_cast<const T*>(descendant);
}

template <typename T, typename U>
inline const T* next(const U& current, const ElementBox& stayWithin)
{
    auto* descendant = LayoutBoxTraversal::next(current, stayWithin);
    while (descendant && !isLayoutBoxOfType<T>(*descendant))
        descendant = LayoutBoxTraversal::next(*descendant, stayWithin);
    return static_cast<const T*>(descendant);
}

template <typename T, typename U>
inline const T* nextSkippingChildren(const U& current, const ElementBox& stayWithin)
{
    auto* descendant = LayoutBoxTraversal::nextSkippingChildren(current, stayWithin);
    while (descendant && !isLayoutBoxOfType<T>(*descendant))
        descendant = LayoutBoxTraversal::nextSkippingChildren(*descendant, stayWithin);
    return static_cast<const T*>(descendant);
}

}

// LayoutIterator

template <typename T>
inline LayoutIterator<T>::LayoutIterator(const ElementBox* root)
    : m_root(root)
    , m_current(nullptr)
{
}

template <typename T>
inline LayoutIterator<T>::LayoutIterator(const ElementBox* root, const T* current)
    : m_root(root)
    , m_current(current)
{
}

template <typename T>
inline LayoutIterator<T>& LayoutIterator<T>::traverseNextSibling()
{
    ASSERT(m_current);
    m_current = Traversal::nextSibling<T>(*m_current);
    return *this;
}

template <typename T>
inline LayoutIterator<T>& LayoutIterator<T>::traverseNext()
{
    ASSERT(m_current);
    m_current = Traversal::next<T>(*m_current, *m_root);
    return *this;
}

template <typename T>
inline LayoutIterator<T>& LayoutIterator<T>::traverseNextSkippingChildren()
{
    ASSERT(m_current);
    m_current = Traversal::nextSkippingChildren<T>(*m_current, *m_root);
    return *this;
}

template <typename T>
inline const T& LayoutIterator<T>::operator*() const
{
    return get();
}

template <typename T>
inline const T* LayoutIterator<T>::operator->() const
{
    return &get();
}

template <typename T>
inline const T& LayoutIterator<T>::get() const
{
    ASSERT(m_current);
    return *m_current;
}

template <typename T>
inline bool LayoutIterator<T>::operator==(const LayoutIterator& other) const
{
    ASSERT(m_root == other.m_root);
    return m_current == other.m_current;
}

}
}
#include "LayoutChildIterator.h"

