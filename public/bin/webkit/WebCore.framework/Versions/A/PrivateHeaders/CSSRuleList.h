/*
 * (C) 1999-2003 Lars Knoll (knoll@kde.org)
 * (C) 2002-2003 Dirk Mueller (mueller@kde.org)
 * Copyright (C) 2002, 2006, 2012 Apple Inc.
 *
 * This library is free software; you can redistribute it and/or
 * modify it under the terms of the GNU Library General Public
 * License as published by the Free Software Foundation; either
 * version 2 of the License, or (at your option) any later version.
 *
 * This library is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 * Library General Public License for more details.
 *
 * You should have received a copy of the GNU Library General Public License
 * along with this library; see the file COPYING.LIB.  If not, write to
 * the Free Software Foundation, Inc., 51 Franklin Street, Fifth Floor,
 * Boston, MA 02110-1301, USA.
 */

#pragma once

#include <wtf/AbstractRefCounted.h>
#include <wtf/RefCounted.h>
#include <wtf/RefPtr.h>
#include <wtf/TZoneMallocInlines.h>
#include <wtf/Vector.h>

namespace WebCore {

class CSSRule;
class CSSStyleSheet;

class CSSRuleList : public AbstractRefCounted {
    WTF_MAKE_NONCOPYABLE(CSSRuleList);
public:
    virtual ~CSSRuleList();

    virtual unsigned length() const = 0;
    virtual CSSRule* item(unsigned index) const = 0;
    bool isSupportedPropertyIndex(unsigned index) const { return item(index); }
    
    virtual CSSStyleSheet* styleSheet() const = 0;
    
protected:
    CSSRuleList();
};

class StaticCSSRuleList final : public CSSRuleList, public RefCounted<StaticCSSRuleList> {
public:
    void ref() const final { RefCounted::ref(); }
    void deref() const final { RefCounted::deref(); }

    static Ref<StaticCSSRuleList> create() { return adoptRef(*new StaticCSSRuleList); }

    Vector<RefPtr<CSSRule>>& rules() { return m_rules; }
    
    CSSStyleSheet* styleSheet() const final { return nullptr; }

    ~StaticCSSRuleList();
private:    
    StaticCSSRuleList();

    unsigned length() const final { return m_rules.size(); }
    CSSRule* item(unsigned index) const final { return index < m_rules.size() ? m_rules[index].get() : nullptr; }

    Vector<RefPtr<CSSRule>> m_rules;
};

// The rule owns the live list.
template <class Rule>
class LiveCSSRuleList final : public CSSRuleList {
    WTF_MAKE_TZONE_ALLOCATED(LiveCSSRuleList);
public:
    LiveCSSRuleList(Rule& rule)
        : m_rule(rule)
    {
    }
    
    void ref() const final { m_rule.ref(); }
    void deref() const final { m_rule.deref(); }

private:
    unsigned length() const final { return m_rule.length(); }
    CSSRule* item(unsigned index) const final { return m_rule.item(index); }
    CSSStyleSheet* styleSheet() const final { return m_rule.parentStyleSheet(); }
    
    Rule& m_rule;
};

} // namespace WebCore
