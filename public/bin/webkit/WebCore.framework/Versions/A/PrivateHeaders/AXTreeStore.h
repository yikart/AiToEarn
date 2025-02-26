/*
 * Copyright (C) 2022-2024 Apple Inc. All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions
 * are met:
 * 1.  Redistributions of source code must retain the above copyright
 *     notice, this list of conditions and the following disclaimer.
 * 2.  Redistributions in binary form must reproduce the above copyright
 *     notice, this list of conditions and the following disclaimer in the
 *     documentation and/or other materials provided with the distribution.
 *
 * THIS SOFTWARE IS PROVIDED BY APPLE INC. AND ITS CONTRIBUTORS ``AS IS'' AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL APPLE INC. OR ITS CONTRIBUTORS BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON
 * ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

#pragma once

#include "AXCoreObject.h"
#include "ActivityState.h"
#include <variant>
#include <wtf/HashMap.h>
#include <wtf/Lock.h>
#include <wtf/NeverDestroyed.h>
#include <wtf/RefPtr.h>
#include <wtf/ThreadSafeWeakPtr.h>
#include <wtf/WeakPtr.h>

namespace WebCore {

#if ENABLE(ACCESSIBILITY_ISOLATED_TREE)
class AXIsolatedTree;
#endif
class AXObjectCache;

using AXTreePtr = std::variant<std::nullptr_t, WeakPtr<AXObjectCache>
#if ENABLE(ACCESSIBILITY_ISOLATED_TREE)
    , RefPtr<AXIsolatedTree>
#endif
>;

using AXTreeWeakPtr = std::variant<WeakPtr<AXObjectCache>
#if ENABLE(ACCESSIBILITY_ISOLATED_TREE)
    , ThreadSafeWeakPtr<AXIsolatedTree>
#endif
>;

AXTreePtr axTreeForID(AXID);
WEBCORE_EXPORT AXTreePtr findAXTree(Function<bool(AXTreePtr)>&&);

template<typename T>
class AXTreeStore {
    // For now, we just disable direct instantiations of this class because it is not
    // needed. Subclasses are expected to declare their own WTF_MAKE_TZONE_ALLOCATED.
    WTF_MAKE_TZONE_NONALLOCATABLE(AXTreeStore);
    WTF_MAKE_NONCOPYABLE(AXTreeStore);
    friend WEBCORE_EXPORT AXTreePtr findAXTree(Function<bool(AXTreePtr)>&&);
public:
    AXID treeID() const { return m_id; }
    static WeakPtr<AXObjectCache> axObjectCacheForID(std::optional<AXID>);
#if ENABLE(ACCESSIBILITY_ISOLATED_TREE)
    static RefPtr<AXIsolatedTree> isolatedTreeForID(std::optional<AXID>);
#endif

protected:
    AXTreeStore(AXID axID = generateNewID())
        : m_id(axID)
    { }

    static void set(AXID, const AXTreeWeakPtr&);
    static void add(AXID, const AXTreeWeakPtr&);
    static void remove(AXID);
    static bool contains(AXID);

    static AXID generateNewID();
    const AXID m_id;
    static Lock s_storeLock;
private:
    static UncheckedKeyHashMap<AXID, WeakPtr<AXObjectCache>>& liveTreeMap();
#if ENABLE(ACCESSIBILITY_ISOLATED_TREE)
    static UncheckedKeyHashMap<AXID, ThreadSafeWeakPtr<AXIsolatedTree>>& isolatedTreeMap() WTF_REQUIRES_LOCK(s_storeLock);
#endif
};

template<typename T>
inline void AXTreeStore<T>::set(AXID axID, const AXTreeWeakPtr& tree)
{
    ASSERT(isMainThread());

    switchOn(tree,
        [&] (const WeakPtr<AXObjectCache>& typedTree) {
            liveTreeMap().set(axID, typedTree);
        }
#if ENABLE(ACCESSIBILITY_ISOLATED_TREE)
        , [&] (const ThreadSafeWeakPtr<AXIsolatedTree>& typedTree) {
            Locker locker { s_storeLock };
            isolatedTreeMap().set(axID, typedTree.get());
        }
#endif
    );
}

template<typename T>
inline void AXTreeStore<T>::add(AXID axID, const AXTreeWeakPtr& tree)
{
    ASSERT(isMainThread());

    switchOn(tree,
        [&] (const WeakPtr<AXObjectCache>& typedTree) {
            liveTreeMap().add(axID, typedTree);
        }
#if ENABLE(ACCESSIBILITY_ISOLATED_TREE)
        , [&] (const ThreadSafeWeakPtr<AXIsolatedTree>& typedTree) {
            Locker locker { s_storeLock };
            isolatedTreeMap().add(axID, typedTree.get());
        }
#endif
    );
}

template<typename T>
inline void AXTreeStore<T>::remove(AXID axID)
{
    if (isMainThread()) {
        liveTreeMap().remove(axID);
        return;
    }
#if ENABLE(ACCESSIBILITY_ISOLATED_TREE)
    Locker locker { s_storeLock };
    isolatedTreeMap().remove(axID);
#endif
}

template<typename T>
inline bool AXTreeStore<T>::contains(AXID axID)
{
    if (isMainThread())
        return liveTreeMap().contains(axID);
#if ENABLE(ACCESSIBILITY_ISOLATED_TREE)
    Locker locker { s_storeLock };
    return isolatedTreeMap().contains(axID);
#endif
}

template<typename T>
inline WeakPtr<AXObjectCache> AXTreeStore<T>::axObjectCacheForID(std::optional<AXID> axID)
{
    return axID ? liveTreeMap().get(*axID) : nullptr;
}

#if ENABLE(ACCESSIBILITY_ISOLATED_TREE)
template<typename T>
inline RefPtr<AXIsolatedTree> AXTreeStore<T>::isolatedTreeForID(std::optional<AXID> axID)
{
    if (!axID)
        return nullptr;

    Locker locker { s_storeLock };
    return isolatedTreeMap().get(*axID).get();
}
#endif

template<typename T>
inline UncheckedKeyHashMap<AXID, WeakPtr<AXObjectCache>>& AXTreeStore<T>::liveTreeMap()
{
    ASSERT(isMainThread());

    static NeverDestroyed<UncheckedKeyHashMap<AXID, WeakPtr<AXObjectCache>>> map;
    return map;
}

#if ENABLE(ACCESSIBILITY_ISOLATED_TREE)
template<typename T>
inline UncheckedKeyHashMap<AXID, ThreadSafeWeakPtr<AXIsolatedTree>>& AXTreeStore<T>::isolatedTreeMap()
{
    static NeverDestroyed<UncheckedKeyHashMap<AXID, ThreadSafeWeakPtr<AXIsolatedTree>>> map;
    return map;
}
#endif

template<typename T>
inline AXID AXTreeStore<T>::generateNewID()
{
    ASSERT(isMainThread());

    std::optional<AXID> axID;
    do {
        axID = AXID::generate();
    } while (liveTreeMap().contains(*axID));
    return *axID;
}

template<typename T>
Lock AXTreeStore<T>::s_storeLock;

inline AXTreePtr axTreeForID(std::optional<AXID> axID)
{
#if ENABLE(ACCESSIBILITY_ISOLATED_TREE)
    if (!isMainThread())
        return AXTreeStore<AXIsolatedTree>::isolatedTreeForID(axID);
#endif
    return AXTreeStore<AXObjectCache>::axObjectCacheForID(axID);
}

} // namespace WebCore
