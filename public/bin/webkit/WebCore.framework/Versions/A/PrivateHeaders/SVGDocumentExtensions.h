/*
 * Copyright (C) 2006 Apple Inc. All rights reserved.
 * Copyright (C) 2006, 2008 Nikolas Zimmermann <zimmermann@kde.org>
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

#include <wtf/CheckedPtr.h>
#include <wtf/Forward.h>
#include <wtf/HashMap.h>
#include <wtf/HashSet.h>
#include <wtf/TZoneMalloc.h>
#include <wtf/WeakHashSet.h>

namespace WebCore {

class Document;
class Element;
class SVGElement;
class SVGFontFaceElement;
class SVGResourcesCache;
class SVGSMILElement;
class SVGSVGElement;
class SVGUseElement;
class WeakPtrImplWithEventTargetData;

class SVGDocumentExtensions final : public CanMakeCheckedPtr<SVGDocumentExtensions> {
    WTF_MAKE_TZONE_ALLOCATED(SVGDocumentExtensions);
    WTF_MAKE_NONCOPYABLE(SVGDocumentExtensions);
    WTF_OVERRIDE_DELETE_FOR_CHECKED_PTR(SVGDocumentExtensions);
public:
    explicit SVGDocumentExtensions(Document&);
    ~SVGDocumentExtensions();

    void addTimeContainer(SVGSVGElement&);
    void removeTimeContainer(SVGSVGElement&);
    WEBCORE_EXPORT Vector<Ref<SVGSVGElement>> allSVGSVGElements() const;

    void startAnimations();
    void pauseAnimations();
    void unpauseAnimations();
    void dispatchLoadEventToOutermostSVGElements();
    bool areAnimationsPaused() const { return m_areAnimationsPaused; }

    void reportWarning(const String&);
    void reportError(const String&);

    SVGResourcesCache& resourcesCache() { return *m_resourcesCache; }

    void addElementToRebuild(SVGElement&);
    void removeElementToRebuild(SVGElement&);
    void rebuildElements();
    void clearTargetDependencies(SVGElement&);
    void rebuildAllElementReferencesForTarget(SVGElement&);

    const WeakHashSet<SVGFontFaceElement, WeakPtrImplWithEventTargetData>& svgFontFaceElements() const { return m_svgFontFaceElements; }
    void registerSVGFontFaceElement(SVGFontFaceElement&);
    void unregisterSVGFontFaceElement(SVGFontFaceElement&);

private:
    Ref<Document> protectedDocument() const;

    WeakRef<Document, WeakPtrImplWithEventTargetData> m_document;
    WeakHashSet<SVGSVGElement, WeakPtrImplWithEventTargetData> m_timeContainers; // For SVG 1.2 support this will need to be made more general.
    WeakHashSet<SVGFontFaceElement, WeakPtrImplWithEventTargetData> m_svgFontFaceElements;
    std::unique_ptr<SVGResourcesCache> m_resourcesCache;

    Vector<Ref<SVGElement>> m_rebuildElements;
    bool m_areAnimationsPaused;

};

} // namespace WebCore
