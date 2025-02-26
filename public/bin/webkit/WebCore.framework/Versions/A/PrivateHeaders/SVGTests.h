/*
 * Copyright (C) 2004, 2005, 2008 Nikolas Zimmermann <zimmermann@kde.org>
 * Copyright (C) 2004, 2005, 2006, 2010 Rob Buis <buis@kde.org>
 * Copyright (C) 2018-2024 Apple Inc. All rights reserved.
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

#include <wtf/RobinHoodHashSet.h>
#include <wtf/TZoneMalloc.h>
#include <wtf/WeakRef.h>

namespace WebCore {

class QualifiedName;
class SVGElement;
class SVGStringList;
class WeakPtrImplWithEventTargetData;

template<typename OwnerType, typename... BaseTypes>
class SVGPropertyOwnerRegistry;

class SVGTests;

class SVGConditionalProcessingAttributes {
    WTF_MAKE_TZONE_ALLOCATED(SVGConditionalProcessingAttributes);
    WTF_MAKE_NONCOPYABLE(SVGConditionalProcessingAttributes);
public:
    SVGConditionalProcessingAttributes(SVGElement& contextElement);

    SVGStringList& requiredExtensions() { return m_requiredExtensions; }
    SVGStringList& systemLanguage() { return m_systemLanguage; }

private:
    Ref<SVGStringList> m_requiredExtensions;
    Ref<SVGStringList> m_systemLanguage;
};

class SVGTests {
    WTF_MAKE_NONCOPYABLE(SVGTests);
public:
    static bool hasExtension(const String&);
    using PropertyRegistry = SVGPropertyOwnerRegistry<SVGTests>;

    static void addSupportedAttributes(MemoryCompactLookupOnlyRobinHoodHashSet<QualifiedName>&);

    SVGConditionalProcessingAttributes& conditionalProcessingAttributes();
    SVGConditionalProcessingAttributes* conditionalProcessingAttributesIfExists() const;

    // These methods are called from DOM through the super classes.
    SVGStringList& requiredExtensions() { return conditionalProcessingAttributes().requiredExtensions(); }
    Ref<SVGStringList> protectedRequiredExtensions();
    SVGStringList& systemLanguage() { return conditionalProcessingAttributes().systemLanguage(); }
    Ref<SVGStringList> protectedSystemLanguage();

protected:
    bool isValid() const;

    void parseAttribute(const QualifiedName&, const AtomString&);
    void svgAttributeChanged(const QualifiedName&);

    SVGTests(SVGElement* contextElement);

private:
    Ref<SVGElement> protectedContextElement() const;

    WeakRef<SVGElement, WeakPtrImplWithEventTargetData> m_contextElement;
};

} // namespace WebCore
