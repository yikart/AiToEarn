/*
 * Copyright (C) 2014, 2015 Apple Inc. All rights reserved.
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

#if ENABLE(CONTENT_EXTENSIONS)

#include "ContentExtensionActions.h"
#include "ResourceLoadInfo.h"
#include <wtf/Hasher.h>
#include <wtf/text/WTFString.h>

namespace WebCore::ContentExtensions {

// A ContentExtensionRule is the smallest unit in a ContentExtension.
//
// It is composed of a trigger and an action. The trigger defines on what kind of content this extension should apply.
// The action defines what to perform on that content.

struct Trigger {
    String urlFilter;
    bool urlFilterIsCaseSensitive { false };
    bool topURLFilterIsCaseSensitive { false };
    bool frameURLFilterIsCaseSensitive { false };
    ResourceFlags flags { 0 };
    Vector<String> conditions;

    WEBCORE_EXPORT Trigger isolatedCopy() const &;
    WEBCORE_EXPORT Trigger isolatedCopy() &&;
    
    void checkValidity()
    {
        auto actionCondition = static_cast<ActionCondition>(flags & ActionConditionMask);
        ASSERT_UNUSED(actionCondition, conditions.isEmpty() == (actionCondition == ActionCondition::None));
        if (topURLFilterIsCaseSensitive)
            ASSERT(actionCondition == ActionCondition::IfTopURL || actionCondition == ActionCondition::UnlessTopURL);
        if (frameURLFilterIsCaseSensitive)
            ASSERT(actionCondition == ActionCondition::IfFrameURL || actionCondition == ActionCondition::UnlessFrameURL);
    }

    bool isEmpty() const
    {
        return urlFilter.isEmpty()
            && !urlFilterIsCaseSensitive
            && !topURLFilterIsCaseSensitive
            && !frameURLFilterIsCaseSensitive
            && !flags
            && conditions.isEmpty();
    }

    friend bool operator==(const Trigger&, const Trigger&) = default;
};

inline void add(Hasher& hasher, const Trigger& trigger)
{
    add(hasher, trigger.urlFilterIsCaseSensitive, trigger.urlFilter, trigger.flags, trigger.conditions);
}

struct TriggerHash {
    static unsigned hash(const Trigger& trigger)
    {
        return computeHash(trigger);
    }
    static bool equal(const Trigger& a, const Trigger& b)
    {
        return a == b;
    }
    static const bool safeToCompareToEmptyOrDeleted = false;
};

struct TriggerHashTraits : public WTF::CustomHashTraits<Trigger> {
    static constexpr bool emptyValueIsZero = false;
    static constexpr bool hasIsEmptyValueFunction = true;

    static void constructDeletedValue(Trigger& trigger)
    {
        new (NotNull, std::addressof(trigger.urlFilter)) String(WTF::HashTableDeletedValue);
    }

    static bool isDeletedValue(const Trigger& trigger)
    {
        return trigger.urlFilter.isHashTableDeletedValue();
    }

    static Trigger emptyValue()
    {
        return Trigger();
    }

    static bool isEmptyValue(const Trigger& trigger)
    {
        return trigger.isEmpty();
    }
};

struct Action {
    Action(ActionData&& data)
        : m_data(WTFMove(data)) { }

    friend bool operator==(const Action&, const Action&) = default;

    const ActionData& data() const { return m_data; }

    WEBCORE_EXPORT Action isolatedCopy() const &;
    WEBCORE_EXPORT Action isolatedCopy() &&;

private:
    ActionData m_data;
};

struct DeserializedAction : public Action {
    static DeserializedAction deserialize(std::span<const uint8_t>, uint32_t location);
    static size_t serializedLength(std::span<const uint8_t>, uint32_t location);

    uint32_t actionID() const { return m_actionID; }

private:
    DeserializedAction(uint32_t actionID, ActionData&& data)
        : Action(WTFMove(data))
        , m_actionID(actionID) { }

    const uint32_t m_actionID;
};

class ContentExtensionRule {
public:
    WEBCORE_EXPORT ContentExtensionRule(Trigger&&, Action&&);

    const Trigger& trigger() const { return m_trigger; }
    const Action& action() const { return m_action; }

    ContentExtensionRule isolatedCopy() const & { return { m_trigger.isolatedCopy(), m_action.isolatedCopy() }; }
    ContentExtensionRule isolatedCopy() && { return { WTFMove(m_trigger).isolatedCopy(), WTFMove(m_action).isolatedCopy() }; }
    friend bool operator==(const ContentExtensionRule&, const ContentExtensionRule&) = default;

private:
    Trigger m_trigger;
    Action m_action;
};

} // namespace WebCore::ContentExtensions

#endif // ENABLE(CONTENT_EXTENSIONS)
