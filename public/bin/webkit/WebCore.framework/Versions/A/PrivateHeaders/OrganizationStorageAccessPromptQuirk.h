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

#include "RegistrableDomain.h"
#include <wtf/HashMap.h>
#include <wtf/Vector.h>

namespace WebCore {

struct OrganizationStorageAccessPromptQuirk {
    String organizationName;
    HashMap<RegistrableDomain, Vector<RegistrableDomain>> quirkDomains;
    Vector<URL> triggerPages;

    bool isHashTableDeletedValue() const { return organizationName.isHashTableDeletedValue(); }

    OrganizationStorageAccessPromptQuirk(String&& organizationName, HashMap<RegistrableDomain, Vector<RegistrableDomain>>&& quirkDomains, Vector<URL>&& triggerPages)
        : organizationName { WTFMove(organizationName) }
        , quirkDomains { WTFMove(quirkDomains) }
        , triggerPages { WTFMove(triggerPages) }
        { }

    OrganizationStorageAccessPromptQuirk(WTF::HashTableDeletedValueType)
        : organizationName { WTF::HashTableDeletedValue }
        { }

    OrganizationStorageAccessPromptQuirk() = default;
};

static bool operator==(const OrganizationStorageAccessPromptQuirk& a, const OrganizationStorageAccessPromptQuirk& b)
{
    return a.organizationName == b.organizationName;
}

inline void add(Hasher& hasher, const OrganizationStorageAccessPromptQuirk& quirk)
{
    add(hasher, quirk.organizationName);
}

struct OrganizationStorageAccessPromptQuirkHashTraits : SimpleClassHashTraits<OrganizationStorageAccessPromptQuirk> {
    static const bool hasIsEmptyValueFunction = true;
    static const bool emptyValueIsZero = false;
    static bool isEmptyValue(const OrganizationStorageAccessPromptQuirk& quirk) { return quirk.organizationName.isNull(); }
};

struct OrganizationStorageAccessPromptQuirkHash {
    static unsigned hash(const OrganizationStorageAccessPromptQuirk& quirk) { return computeHash(quirk); }
    static bool equal(const OrganizationStorageAccessPromptQuirk& a, const OrganizationStorageAccessPromptQuirk& b) { return a == b; }
    static const bool safeToCompareToEmptyOrDeleted = false;
};

} // namespace WebCore

namespace WTF {

template<> struct HashTraits<WebCore::OrganizationStorageAccessPromptQuirk> : WebCore::OrganizationStorageAccessPromptQuirkHashTraits { };
template<> struct DefaultHash<WebCore::OrganizationStorageAccessPromptQuirk> : WebCore::OrganizationStorageAccessPromptQuirkHash { };

} // namespace WTF
