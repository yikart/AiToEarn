/*
 * Copyright (C) 2008-2021 Apple Inc. All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions
 * are met:
 *
 * 1.  Redistributions of source code must retain the above copyright
 *     notice, this list of conditions and the following disclaimer.
 * 2.  Redistributions in binary form must reproduce the above copyright
 *     notice, this list of conditions and the following disclaimer in the
 *     documentation and/or other materials provided with the distribution.
 * 3.  Neither the name of Apple Inc. ("Apple") nor the names of
 *     its contributors may be used to endorse or promote products derived
 *     from this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY APPLE AND ITS CONTRIBUTORS "AS IS" AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL APPLE OR ITS CONTRIBUTORS BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
 * THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

#pragma once

#include "DirectEvalExecutable.h"
#include <wtf/HashMap.h>
#include <wtf/RefPtr.h>
#include <wtf/text/StringHash.h>

namespace JSC {

    class SlotVisitor;

    class DirectEvalCodeCache {
    public:
        class CacheKey {
        public:
            CacheKey(const String& source, BytecodeIndex bytecodeIndex)
                : m_source(source.impl())
                , m_bytecodeIndex(bytecodeIndex)
            {
            }

            CacheKey(WTF::HashTableDeletedValueType)
                : m_source(WTF::HashTableDeletedValue)
            {
            }

            CacheKey() = default;

            unsigned hash() const { return m_source->hash() ^ m_bytecodeIndex.asBits(); }

            bool isEmptyValue() const { return !m_source; }

            bool operator==(const CacheKey& other) const
            {
                return m_bytecodeIndex == other.m_bytecodeIndex && WTF::equal(m_source.get(), other.m_source.get());
            }

            bool isHashTableDeletedValue() const { return m_source.isHashTableDeletedValue(); }

            struct Hash {
                static unsigned hash(const CacheKey& key)
                {
                    return key.hash();
                }
                static bool equal(const CacheKey& lhs, const CacheKey& rhs)
                {
                    return lhs == rhs;
                }
                static constexpr bool safeToCompareToEmptyOrDeleted = false;
            };

            typedef SimpleClassHashTraits<CacheKey> HashTraits;

        private:
            RefPtr<StringImpl> m_source;
            BytecodeIndex m_bytecodeIndex;
        };

        DirectEvalExecutable* tryGet(const String& evalSource, BytecodeIndex bytecodeIndex)
        {
            return m_cacheMap.inlineGet(CacheKey(evalSource, bytecodeIndex)).get();
        }
        
        void set(JSGlobalObject* globalObject, JSCell* owner, const String& evalSource, BytecodeIndex bytecodeIndex, DirectEvalExecutable* evalExecutable)
        {
            if (m_cacheMap.size() < maxCacheEntries)
                setSlow(globalObject, owner, evalSource, bytecodeIndex, evalExecutable);
        }

        bool isEmpty() const { return m_cacheMap.isEmpty(); }

        DECLARE_VISIT_AGGREGATE;

        void clear();

    private:
        static constexpr int maxCacheEntries = 64;

        void setSlow(JSGlobalObject*, JSCell* owner, const String& evalSource, BytecodeIndex, DirectEvalExecutable*);

        typedef UncheckedKeyHashMap<CacheKey, WriteBarrier<DirectEvalExecutable>, CacheKey::Hash, CacheKey::HashTraits> EvalCacheMap;
        EvalCacheMap m_cacheMap;
        Lock m_lock;
    };

} // namespace JSC
