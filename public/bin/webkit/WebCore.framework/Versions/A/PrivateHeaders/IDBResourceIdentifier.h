/*
 * Copyright (C) 2015, 2016 Apple Inc. All rights reserved.
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

#include "ProcessIdentifier.h"
#include <wtf/ArgumentCoder.h>
#include <wtf/Hasher.h>

namespace WebCore {

class IDBRequest;

namespace IDBClient {
class IDBConnectionProxy;
}

namespace IDBServer {
class IDBConnectionToClient;
}

using IDBConnectionIdentifier = ProcessIdentifier;
struct IDBResourceIdentifierHashTraits;

class IDBResourceIdentifier {
public:
    explicit IDBResourceIdentifier(const IDBClient::IDBConnectionProxy&);
    IDBResourceIdentifier(const IDBClient::IDBConnectionProxy&, const IDBRequest&);
    explicit IDBResourceIdentifier(const IDBServer::IDBConnectionToClient&);

    bool isEmpty() const
    {
        return !m_resourceNumber && !m_idbConnectionIdentifier;
    }

    friend bool operator==(const IDBResourceIdentifier&, const IDBResourceIdentifier&) = default;
    
    std::optional<IDBConnectionIdentifier> connectionIdentifier() const { return m_idbConnectionIdentifier; }

    WEBCORE_EXPORT IDBResourceIdentifier isolatedCopy() const;

#if !LOG_DISABLED
    String loggingString() const;
#endif

    WEBCORE_EXPORT IDBResourceIdentifier();
private:
    friend struct IPC::ArgumentCoder<IDBResourceIdentifier, void>;
    friend struct IDBResourceIdentifierHashTraits;
    friend void add(Hasher&, const IDBResourceIdentifier&);

    WEBCORE_EXPORT IDBResourceIdentifier(std::optional<IDBConnectionIdentifier>, uint64_t resourceIdentifier);

    Markable<IDBConnectionIdentifier> m_idbConnectionIdentifier;
    uint64_t m_resourceNumber { 0 };
};

inline void add(Hasher& hasher, const IDBResourceIdentifier& identifier)
{
    add(hasher, identifier.m_idbConnectionIdentifier, identifier.m_resourceNumber);
}

struct IDBResourceIdentifierHash {
    static unsigned hash(const IDBResourceIdentifier& a) { return computeHash(a); }
    static bool equal(const IDBResourceIdentifier& a, const IDBResourceIdentifier& b) { return a == b; }
    static const bool safeToCompareToEmptyOrDeleted = false;
};

struct IDBResourceIdentifierHashTraits : WTF::CustomHashTraits<IDBResourceIdentifier> {
    static constexpr bool hasIsEmptyValueFunction = true;
    static constexpr bool emptyValueIsZero = false;
    static constexpr uint64_t resourceNumberDeletedValue = -1;

    static IDBResourceIdentifier emptyValue()
    {
        return { };
    }

    static bool isEmptyValue(const IDBResourceIdentifier& identifier)
    {
        return identifier.isEmpty();
    }

    static void constructDeletedValue(IDBResourceIdentifier& identifier)
    {
        identifier.m_resourceNumber = resourceNumberDeletedValue;
    }

    static bool isDeletedValue(const IDBResourceIdentifier& identifier)
    {
        return identifier.m_resourceNumber == resourceNumberDeletedValue;
    }
};

} // namespace WebCore

namespace WTF {

template<> struct HashTraits<WebCore::IDBResourceIdentifier> : WebCore::IDBResourceIdentifierHashTraits { };
template<> struct DefaultHash<WebCore::IDBResourceIdentifier> : WebCore::IDBResourceIdentifierHash { };

inline WebCore::IDBConnectionIdentifier crossThreadCopy(WebCore::IDBConnectionIdentifier identifier)
{
    return identifier;
}

} // namespace WTF
