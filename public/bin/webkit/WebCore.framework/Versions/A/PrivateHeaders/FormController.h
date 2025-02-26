/*
 * Copyright (C) 2006-2021 Apple Inc. All rights reserved.
 * Copyright (C) 2010, 2011, 2012 Google Inc. All rights reserved.
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
 *
 */

#pragma once

#include <wtf/Forward.h>
#include <wtf/HashMap.h>
#include <wtf/TZoneMalloc.h>

namespace WebCore {

class Document;
class FormListedElement;
class HTMLFormElement;
class ValidatedFormListedElement;

using FormControlState = Vector<AtomString>;

class FormController {
    WTF_MAKE_TZONE_ALLOCATED(FormController);

public:
    FormController();
    ~FormController();

    WEBCORE_EXPORT Vector<AtomString> formElementsState(const Document&) const;
    WEBCORE_EXPORT void setStateForNewFormElements(const Vector<AtomString>& stateVector);

    void willDeleteForm(HTMLFormElement&);
    void restoreControlStateFor(ValidatedFormListedElement&);
    void restoreControlStateIn(HTMLFormElement&);
    bool hasFormStateToRestore() const;

    WEBCORE_EXPORT static Vector<String> referencedFilePaths(const Vector<AtomString>& stateVector);
    static HTMLFormElement* ownerForm(const FormListedElement&);

private:
    class FormKeyGenerator;
    class SavedFormState;
    using SavedFormStateMap = UncheckedKeyHashMap<String, SavedFormState>;

    FormControlState takeStateForFormElement(const ValidatedFormListedElement&);
    static SavedFormStateMap parseStateVector(const Vector<AtomString>&);

    SavedFormStateMap m_savedFormStateMap;
    std::unique_ptr<FormKeyGenerator> m_formKeyGenerator;
};

} // namespace WebCore
