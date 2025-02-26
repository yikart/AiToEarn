/*
    Copyright (C) 2004, 2005, 2007 Nikolas Zimmermann <zimmermann@kde.org>
                  2004, 2005 Rob Buis <buis@kde.org>
    Copyright (C) 2005-2017 Apple Inc. All rights reserved.
    Copyright (C) Research In Motion Limited 2010. All rights reserved.
    Copyright (C) 2014 Adobe Systems Incorporated. All rights reserved.

    This library is free software; you can redistribute it and/or
    modify it under the terms of the GNU Library General Public
    License as published by the Free Software Foundation; either
    version 2 of the License, or (at your option) any later version.

    This library is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
    Library General Public License for more details.

    You should have received a copy of the GNU Library General Public License
    along with this library; see the file COPYING.LIB.  If not, write to
    the Free Software Foundation, Inc., 51 Franklin Street, Fifth Floor,
    Boston, MA 02110-1301, USA.
*/

#pragma once

#include "RenderStyle.h"
#include "RenderStyleConstants.h"
#include "SVGRenderStyleDefs.h"
#include "StyleRareInheritedData.h"
#include "WindRule.h"

namespace WTF {
class TextStream;
}

namespace WebCore {

DECLARE_ALLOCATOR_WITH_HEAP_IDENTIFIER(SVGRenderStyle);
class SVGRenderStyle : public RefCounted<SVGRenderStyle> {
    WTF_MAKE_FAST_ALLOCATED_WITH_HEAP_IDENTIFIER(SVGRenderStyle);
public:
    static Ref<SVGRenderStyle> createDefaultStyle();
    static Ref<SVGRenderStyle> create() { return adoptRef(*new SVGRenderStyle); }
    Ref<SVGRenderStyle> copy() const;
    ~SVGRenderStyle();

    bool inheritedEqual(const SVGRenderStyle&) const;
    void inheritFrom(const SVGRenderStyle&);
    void copyNonInheritedFrom(const SVGRenderStyle&);

    bool changeRequiresRepaint(const SVGRenderStyle& other, bool currentColorDiffers) const;
    bool changeRequiresLayout(const SVGRenderStyle& other) const;

    bool operator==(const SVGRenderStyle&) const;

#if !LOG_DISABLED
    void dumpDifferences(TextStream&, const SVGRenderStyle&) const;
#endif

    // Initial values for all the properties
    static AlignmentBaseline initialAlignmentBaseline() { return AlignmentBaseline::Baseline; }
    static DominantBaseline initialDominantBaseline() { return DominantBaseline::Auto; }
    static BaselineShift initialBaselineShift() { return BaselineShift::Baseline; }
    static VectorEffect initialVectorEffect() { return VectorEffect::None; }
    static BufferedRendering initialBufferedRendering() { return BufferedRendering::Auto; }
    static WindRule initialClipRule() { return WindRule::NonZero; }
    static ColorInterpolation initialColorInterpolation() { return ColorInterpolation::SRGB; }
    static ColorInterpolation initialColorInterpolationFilters() { return ColorInterpolation::LinearRGB; }
    static ColorRendering initialColorRendering() { return ColorRendering::Auto; }
    static WindRule initialFillRule() { return WindRule::NonZero; }
    static ShapeRendering initialShapeRendering() { return ShapeRendering::Auto; }
    static TextAnchor initialTextAnchor() { return TextAnchor::Start; }
    static GlyphOrientation initialGlyphOrientationHorizontal() { return GlyphOrientation::Degrees0; }
    static GlyphOrientation initialGlyphOrientationVertical() { return GlyphOrientation::Auto; }
    static float initialFillOpacity() { return 1; }
    static SVGPaintType initialFillPaintType() { return SVGPaintType::RGBColor; }
    static Style::Color initialFillPaintColor() { return Color::black; }
    static String initialFillPaintUri() { return String(); }
    static float initialStrokeOpacity() { return 1; }
    static SVGPaintType initialStrokePaintType() { return SVGPaintType::None; }
    static Style::Color initialStrokePaintColor() { /* No initial value per spec. */ return Color { }; }
    static String initialStrokePaintUri() { return String(); }
    static Vector<SVGLengthValue> initialStrokeDashArray() { return { }; }
    static float initialStopOpacity() { return 1; }
    static Style::Color initialStopColor() { return Color::black; }
    static float initialFloodOpacity() { return 1; }
    static Style::Color initialFloodColor() { return Color::black; }
    static Style::Color initialLightingColor() { return Color::white; }
    static String initialMarkerStartResource() { return String(); }
    static String initialMarkerMidResource() { return String(); }
    static String initialMarkerEndResource() { return String(); }
    static MaskType initialMaskType() { return MaskType::Luminance; }
    static SVGLengthValue initialBaselineShiftValue() { return SVGLengthValue(0, SVGLengthType::Number); }

    // SVG CSS Property setters
    void setAlignmentBaseline(AlignmentBaseline val) { m_nonInheritedFlags.flagBits.alignmentBaseline = static_cast<unsigned>(val); }
    void setDominantBaseline(DominantBaseline val) { m_nonInheritedFlags.flagBits.dominantBaseline = static_cast<unsigned>(val); }
    void setBaselineShift(BaselineShift val) { m_nonInheritedFlags.flagBits.baselineShift = static_cast<unsigned>(val); }
    void setVectorEffect(VectorEffect val) { m_nonInheritedFlags.flagBits.vectorEffect = static_cast<unsigned>(val); }
    void setBufferedRendering(BufferedRendering val) { m_nonInheritedFlags.flagBits.bufferedRendering = static_cast<unsigned>(val); }
    void setClipRule(WindRule val) { m_inheritedFlags.clipRule = static_cast<unsigned>(val); }
    void setColorInterpolation(ColorInterpolation val) { m_inheritedFlags.colorInterpolation = static_cast<unsigned>(val); }
    void setColorInterpolationFilters(ColorInterpolation val) { m_inheritedFlags.colorInterpolationFilters = static_cast<unsigned>(val); }
    void setFillRule(WindRule val) { m_inheritedFlags.fillRule = static_cast<unsigned>(val); }
    void setShapeRendering(ShapeRendering val) { m_inheritedFlags.shapeRendering = static_cast<unsigned>(val); }
    void setTextAnchor(TextAnchor val) { m_inheritedFlags.textAnchor = static_cast<unsigned>(val); }
    void setGlyphOrientationHorizontal(GlyphOrientation val) { m_inheritedFlags.glyphOrientationHorizontal = static_cast<unsigned>(val); }
    void setGlyphOrientationVertical(GlyphOrientation val) { m_inheritedFlags.glyphOrientationVertical = static_cast<unsigned>(val); }
    void setMaskType(MaskType val) { m_nonInheritedFlags.flagBits.maskType = static_cast<unsigned>(val); }
    void setCx(const Length&);
    void setCy(const Length&);
    void setR(const Length&);
    void setRx(const Length&);
    void setRy(const Length&);
    void setX(const Length&);
    void setY(const Length&);
    void setD(RefPtr<StylePathData>&&);
    void setFillOpacity(float);
    void setFillPaint(SVGPaintType, const Style::Color&, const String& uri, bool applyToRegularStyle, bool applyToVisitedLinkStyle);
    void setStrokeOpacity(float);
    void setStrokePaint(SVGPaintType, const Style::Color&, const String& uri, bool applyToRegularStyle, bool applyToVisitedLinkStyle);

    void setStrokeDashArray(const Vector<SVGLengthValue>&);
    void setStrokeDashOffset(const Length&);
    void setStopOpacity(float);
    void setStopColor(const Style::Color&);
    void setFloodOpacity(float);
    void setFloodColor(const Style::Color&);
    void setLightingColor(const Style::Color&);
    void setBaselineShiftValue(const SVGLengthValue&);

    // Setters for inherited resources
    void setMarkerStartResource(const String&);
    void setMarkerMidResource(const String&);
    void setMarkerEndResource(const String&);

    // Read accessors for all the properties
    AlignmentBaseline alignmentBaseline() const { return static_cast<AlignmentBaseline>(m_nonInheritedFlags.flagBits.alignmentBaseline); }
    DominantBaseline dominantBaseline() const { return static_cast<DominantBaseline>(m_nonInheritedFlags.flagBits.dominantBaseline); }
    BaselineShift baselineShift() const { return static_cast<BaselineShift>(m_nonInheritedFlags.flagBits.baselineShift); }
    VectorEffect vectorEffect() const { return static_cast<VectorEffect>(m_nonInheritedFlags.flagBits.vectorEffect); }
    BufferedRendering bufferedRendering() const { return static_cast<BufferedRendering>(m_nonInheritedFlags.flagBits.bufferedRendering); }
    WindRule clipRule() const { return static_cast<WindRule>(m_inheritedFlags.clipRule); }
    ColorInterpolation colorInterpolation() const { return static_cast<ColorInterpolation>(m_inheritedFlags.colorInterpolation); }
    ColorInterpolation colorInterpolationFilters() const { return static_cast<ColorInterpolation>(m_inheritedFlags.colorInterpolationFilters); }
    WindRule fillRule() const { return static_cast<WindRule>(m_inheritedFlags.fillRule); }
    ShapeRendering shapeRendering() const { return static_cast<ShapeRendering>(m_inheritedFlags.shapeRendering); }
    TextAnchor textAnchor() const { return static_cast<TextAnchor>(m_inheritedFlags.textAnchor); }
    GlyphOrientation glyphOrientationHorizontal() const { return static_cast<GlyphOrientation>(m_inheritedFlags.glyphOrientationHorizontal); }
    GlyphOrientation glyphOrientationVertical() const { return static_cast<GlyphOrientation>(m_inheritedFlags.glyphOrientationVertical); }
    float fillOpacity() const { return m_fillData->opacity; }
    SVGPaintType fillPaintType() const { return static_cast<SVGPaintType>(m_fillData->paintType); }
    const Style::Color& fillPaintColor() const { return m_fillData->paintColor; }
    const String& fillPaintUri() const { return m_fillData->paintUri; }    
    float strokeOpacity() const { return m_strokeData->opacity; }
    SVGPaintType strokePaintType() const { return static_cast<SVGPaintType>(m_strokeData->paintType); }
    const Style::Color& strokePaintColor() const { return m_strokeData->paintColor; }
    const String& strokePaintUri() const { return m_strokeData->paintUri; }
    Vector<SVGLengthValue> strokeDashArray() const { return m_strokeData->dashArray; }
    const Length& strokeDashOffset() const { return m_strokeData->dashOffset; }
    float stopOpacity() const { return m_stopData->opacity; }
    const Style::Color& stopColor() const { return m_stopData->color; }
    float floodOpacity() const { return m_miscData->floodOpacity; }
    const Style::Color& floodColor() const { return m_miscData->floodColor; }
    const Style::Color& lightingColor() const { return m_miscData->lightingColor; }
    SVGLengthValue baselineShiftValue() const { return m_miscData->baselineShiftValue; }
    const Length& cx() const { return m_layoutData->cx; }
    const Length& cy() const { return m_layoutData->cy; }
    const Length& r() const { return m_layoutData->r; }
    const Length& rx() const { return m_layoutData->rx; }
    const Length& ry() const { return m_layoutData->ry; }
    const Length& x() const { return m_layoutData->x; }
    const Length& y() const { return m_layoutData->y; }
    StylePathData* d() const { return m_layoutData->d.get(); }
    const String& markerStartResource() const { return m_inheritedResourceData->markerStart; }
    const String& markerMidResource() const { return m_inheritedResourceData->markerMid; }
    const String& markerEndResource() const { return m_inheritedResourceData->markerEnd; }
    MaskType maskType() const { return static_cast<MaskType>(m_nonInheritedFlags.flagBits.maskType); }

    SVGPaintType visitedLinkFillPaintType() const { return static_cast<SVGPaintType>(m_fillData->visitedLinkPaintType); }
    const Style::Color& visitedLinkFillPaintColor() const { return m_fillData->visitedLinkPaintColor; }
    const String& visitedLinkFillPaintUri() const { return m_fillData->visitedLinkPaintUri; }
    SVGPaintType visitedLinkStrokePaintType() const { return static_cast<SVGPaintType>(m_strokeData->visitedLinkPaintType); }
    const Style::Color& visitedLinkStrokePaintColor() const { return m_strokeData->visitedLinkPaintColor; }
    const String& visitedLinkStrokePaintUri() const { return m_strokeData->visitedLinkPaintUri; }

    // convenience
    bool hasMarkers() const { return !markerStartResource().isEmpty() || !markerMidResource().isEmpty() || !markerEndResource().isEmpty(); }
    bool hasStroke() const { return strokePaintType() != SVGPaintType::None; }
    bool hasFill() const { return fillPaintType() != SVGPaintType::None; }

    void conservativelyCollectChangedAnimatableProperties(const SVGRenderStyle&, CSSPropertiesBitSet&) const;

private:
    SVGRenderStyle();
    SVGRenderStyle(const SVGRenderStyle&);

    enum CreateDefaultType { CreateDefault };
    SVGRenderStyle(CreateDefaultType); // Used to create the default style.

    void setBitDefaults();

    struct InheritedFlags {
        friend bool operator==(const InheritedFlags&, const InheritedFlags&) = default;

#if !LOG_DISABLED
        void dumpDifferences(TextStream&, const InheritedFlags&) const;
#endif

        unsigned shapeRendering : 2; // ShapeRendering
        unsigned clipRule : 1; // WindRule
        unsigned fillRule : 1; // WindRule
        unsigned textAnchor : 2; // TextAnchor
        unsigned colorInterpolation : 2; // ColorInterpolation
        unsigned colorInterpolationFilters : 2; // ColorInterpolation
        unsigned glyphOrientationHorizontal : 3; // GlyphOrientation
        unsigned glyphOrientationVertical : 3; // GlyphOrientation
    };

    struct NonInheritedFlags {
        // 32 bit non-inherited, don't add to the struct, or the operator will break.
        bool operator==(const NonInheritedFlags& other) const { return flags == other.flags; }

#if !LOG_DISABLED
        void dumpDifferences(TextStream&, const NonInheritedFlags&) const;
#endif

        union {
            struct {
                unsigned alignmentBaseline : 4; // AlignmentBaseline
                unsigned dominantBaseline : 4; // DominantBaseline
                unsigned baselineShift : 2; // BaselineShift
                unsigned vectorEffect : 1; // VectorEffect
                unsigned bufferedRendering : 2; // BufferedRendering
                unsigned maskType : 1; // MaskType
                // 18 bits unused
            } flagBits;
            uint32_t flags;
        };
    };

    InheritedFlags m_inheritedFlags;
    NonInheritedFlags m_nonInheritedFlags;

    // inherited attributes
    DataRef<StyleFillData> m_fillData;
    DataRef<StyleStrokeData> m_strokeData;
    DataRef<StyleInheritedResourceData> m_inheritedResourceData;

    // non-inherited attributes
    DataRef<StyleStopData> m_stopData;
    DataRef<StyleMiscData> m_miscData;
    DataRef<StyleLayoutData> m_layoutData;
};

inline SVGRenderStyle& RenderStyle::accessSVGStyle() { return m_svgStyle.access(); }
inline SVGLengthValue RenderStyle::baselineShiftValue() const { return svgStyle().baselineShiftValue(); }
inline const Length& RenderStyle::cx() const { return svgStyle().cx(); }
inline const Length& RenderStyle::cy() const { return svgStyle().cy(); }
inline StylePathData* RenderStyle::d() const { return svgStyle().d(); }
inline float RenderStyle::fillOpacity() const { return svgStyle().fillOpacity(); }
inline const Style::Color& RenderStyle::fillPaintColor() const { return svgStyle().fillPaintColor(); }
inline const Style::Color& RenderStyle::visitedFillPaintColor() const { return svgStyle().visitedLinkFillPaintColor(); }
inline SVGPaintType RenderStyle::fillPaintType() const { return svgStyle().fillPaintType(); }
inline SVGPaintType RenderStyle::visitedFillPaintType() const { return svgStyle().visitedLinkFillPaintType(); }
inline const Style::Color& RenderStyle::floodColor() const { return svgStyle().floodColor(); }
inline float RenderStyle::floodOpacity() const { return svgStyle().floodOpacity(); }
inline bool RenderStyle::hasExplicitlySetStrokeWidth() const { return m_rareInheritedData->hasSetStrokeWidth; }
inline bool RenderStyle::hasVisibleStroke() const { return svgStyle().hasStroke() && !strokeWidth().isZero(); }
inline const Style::Color& RenderStyle::lightingColor() const { return svgStyle().lightingColor(); }
inline const Length& RenderStyle::r() const { return svgStyle().r(); }
inline const Length& RenderStyle::rx() const { return svgStyle().rx(); }
inline const Length& RenderStyle::ry() const { return svgStyle().ry(); }
inline void RenderStyle::setBaselineShiftValue(SVGLengthValue s) { accessSVGStyle().setBaselineShiftValue(s); }
inline void RenderStyle::setCx(Length&& cx) { accessSVGStyle().setCx(WTFMove(cx)); }
inline void RenderStyle::setCy(Length&& cy) { accessSVGStyle().setCy(WTFMove(cy)); }
inline void RenderStyle::setD(RefPtr<StylePathData>&& d) { accessSVGStyle().setD(WTFMove(d)); }
inline void RenderStyle::setFillOpacity(float f) { accessSVGStyle().setFillOpacity(f); }
inline void RenderStyle::setFillPaintColor(const Style::Color& color) { accessSVGStyle().setFillPaint(SVGPaintType::RGBColor, color, emptyString(), true, false); }
inline void RenderStyle::setVisitedFillPaintColor(const Style::Color& color) { accessSVGStyle().setFillPaint(SVGPaintType::RGBColor, color, emptyString(), false, true); }

inline void RenderStyle::setFloodColor(const Style::Color& c) { accessSVGStyle().setFloodColor(c); }
inline void RenderStyle::setFloodOpacity(float f) { accessSVGStyle().setFloodOpacity(f); }
inline void RenderStyle::setLightingColor(const Style::Color& c) { accessSVGStyle().setLightingColor(c); }
inline void RenderStyle::setR(Length&& r) { accessSVGStyle().setR(WTFMove(r)); }
inline void RenderStyle::setRx(Length&& rx) { accessSVGStyle().setRx(WTFMove(rx)); }
inline void RenderStyle::setRy(Length&& ry) { accessSVGStyle().setRy(WTFMove(ry)); }
inline void RenderStyle::setStopColor(const Style::Color& c) { accessSVGStyle().setStopColor(c); }
inline void RenderStyle::setStopOpacity(float f) { accessSVGStyle().setStopOpacity(f); }
inline void RenderStyle::setStrokeDashArray(Vector<SVGLengthValue> array) { accessSVGStyle().setStrokeDashArray(array); }
inline void RenderStyle::setStrokeDashOffset(Length&& d) { accessSVGStyle().setStrokeDashOffset(WTFMove(d)); }
inline void RenderStyle::setStrokeOpacity(float f) { accessSVGStyle().setStrokeOpacity(f); }
inline void RenderStyle::setStrokePaintColor(const Style::Color& color) { accessSVGStyle().setStrokePaint(SVGPaintType::RGBColor, color, emptyString(), true, false); }
inline void RenderStyle::setVisitedStrokePaintColor(const Style::Color& color) { accessSVGStyle().setStrokePaint(SVGPaintType::RGBColor, color, emptyString(), false, true); }
inline void RenderStyle::setX(Length&& x) { accessSVGStyle().setX(WTFMove(x)); }
inline void RenderStyle::setY(Length&& y) { accessSVGStyle().setY(WTFMove(y)); }
inline const Style::Color& RenderStyle::stopColor() const { return svgStyle().stopColor(); }
inline float RenderStyle::stopOpacity() const { return svgStyle().stopOpacity(); }
inline Vector<SVGLengthValue> RenderStyle::strokeDashArray() const { return svgStyle().strokeDashArray(); }
inline const Length& RenderStyle::strokeDashOffset() const { return svgStyle().strokeDashOffset(); }
inline float RenderStyle::strokeOpacity() const { return svgStyle().strokeOpacity(); }
inline const Style::Color& RenderStyle::strokePaintColor() const { return svgStyle().strokePaintColor(); }
inline const Style::Color& RenderStyle::visitedStrokePaintColor() const { return svgStyle().visitedLinkStrokePaintColor(); }
inline SVGPaintType RenderStyle::strokePaintType() const { return svgStyle().strokePaintType(); }
inline SVGPaintType RenderStyle::visitedStrokePaintType() const { return svgStyle().visitedLinkStrokePaintType(); }
inline const Length& RenderStyle::strokeWidth() const { return m_rareInheritedData->strokeWidth; }
inline const Length& RenderStyle::x() const { return svgStyle().x(); }
inline const Length& RenderStyle::y() const { return svgStyle().y(); }

inline void SVGRenderStyle::setCx(const Length& length)
{
    if (!(m_layoutData->cx == length))
        m_layoutData.access().cx = length;
}

inline void SVGRenderStyle::setCy(const Length& length)
{
    if (!(m_layoutData->cy == length))
        m_layoutData.access().cy = length;
}

inline void SVGRenderStyle::setR(const Length& length)
{
    if (!(m_layoutData->r == length))
        m_layoutData.access().r = length;
}

inline void SVGRenderStyle::setRx(const Length& length)
{
    if (!(m_layoutData->rx == length))
        m_layoutData.access().rx = length;
}

inline void SVGRenderStyle::setRy(const Length& length)
{
    if (!(m_layoutData->ry == length))
        m_layoutData.access().ry = length;
}

inline void SVGRenderStyle::setX(const Length& length)
{
    if (!(m_layoutData->x == length))
        m_layoutData.access().x = length;
}

inline void SVGRenderStyle::setY(const Length& length)
{
    if (!(m_layoutData->y == length))
        m_layoutData.access().y = length;
}

inline void SVGRenderStyle::setD(RefPtr<StylePathData>&& d)
{
    if (!(m_layoutData->d == d))
        m_layoutData.access().d = d;
}

inline void SVGRenderStyle::setFillOpacity(float opacity)
{
    auto clampedOpacity = clampTo<float>(opacity, 0.f, 1.f);
    if (!(m_fillData->opacity == clampedOpacity))
        m_fillData.access().opacity = clampedOpacity;
}

inline void SVGRenderStyle::setFillPaint(SVGPaintType type, const Style::Color& color, const String& uri, bool applyToRegularStyle, bool applyToVisitedLinkStyle)
{
    if (applyToRegularStyle) {
        if (!(m_fillData->paintType == type))
            m_fillData.access().paintType = type;
        if (!(m_fillData->paintColor == color))
            m_fillData.access().paintColor = color;
        if (!(m_fillData->paintUri == uri))
            m_fillData.access().paintUri = uri;
    }
    if (applyToVisitedLinkStyle) {
        if (!(m_fillData->visitedLinkPaintType == type))
            m_fillData.access().visitedLinkPaintType = type;
        if (!(m_fillData->visitedLinkPaintColor == color))
            m_fillData.access().visitedLinkPaintColor = color;
        if (!(m_fillData->visitedLinkPaintUri == uri))
            m_fillData.access().visitedLinkPaintUri = uri;
    }
}

inline void SVGRenderStyle::setStrokeOpacity(float opacity)
{
    auto clampedOpacity = clampTo<float>(opacity, 0.f, 1.f);
    if (!(m_strokeData->opacity == clampedOpacity))
        m_strokeData.access().opacity = clampedOpacity;
}

inline void SVGRenderStyle::setStrokePaint(SVGPaintType type, const Style::Color& color, const String& uri, bool applyToRegularStyle, bool applyToVisitedLinkStyle)
{
    if (applyToRegularStyle) {
        if (!(m_strokeData->paintType == type))
            m_strokeData.access().paintType = type;
        if (!(m_strokeData->paintColor == color))
            m_strokeData.access().paintColor = color;
        if (!(m_strokeData->paintUri == uri))
            m_strokeData.access().paintUri = uri;
    }
    if (applyToVisitedLinkStyle) {
        if (!(m_strokeData->visitedLinkPaintType == type))
            m_strokeData.access().visitedLinkPaintType = type;
        if (!(m_strokeData->visitedLinkPaintColor == color))
            m_strokeData.access().visitedLinkPaintColor = color;
        if (!(m_strokeData->visitedLinkPaintUri == uri))
            m_strokeData.access().visitedLinkPaintUri = uri;
    }
}

inline void SVGRenderStyle::setStrokeDashArray(const Vector<SVGLengthValue>& array)
{
    if (!(m_strokeData->dashArray == array))
        m_strokeData.access().dashArray = array;
}

inline void SVGRenderStyle::setStrokeDashOffset(const Length& offset)
{
    if (!(m_strokeData->dashOffset == offset))
        m_strokeData.access().dashOffset = offset;
}

inline void SVGRenderStyle::setStopOpacity(float opacity)
{
    auto clampedOpacity = clampTo<float>(opacity, 0.f, 1.f);
    if (!(m_stopData->opacity == clampedOpacity))
        m_stopData.access().opacity = clampedOpacity;
}

inline void SVGRenderStyle::setStopColor(const Style::Color& color)
{
    if (!(m_stopData->color == color))
        m_stopData.access().color = color;
}

inline void SVGRenderStyle::setFloodOpacity(float opacity)
{
    auto clampedOpacity = clampTo<float>(opacity, 0.f, 1.f);
    if (!(m_miscData->floodOpacity == clampedOpacity))
        m_miscData.access().floodOpacity = clampedOpacity;
}

inline void SVGRenderStyle::setFloodColor(const Style::Color& color)
{
    if (!(m_miscData->floodColor == color))
        m_miscData.access().floodColor = color;
}

inline void SVGRenderStyle::setLightingColor(const Style::Color& color)
{
    if (!(m_miscData->lightingColor == color))
        m_miscData.access().lightingColor = color;
}

inline void SVGRenderStyle::setBaselineShiftValue(const SVGLengthValue& shiftValue)
{
    if (!(m_miscData->baselineShiftValue == shiftValue))
        m_miscData.access().baselineShiftValue = shiftValue;
}

inline void SVGRenderStyle::setMarkerStartResource(const String& resource)
{
    if (!(m_inheritedResourceData->markerStart == resource))
        m_inheritedResourceData.access().markerStart = resource;
}

inline void SVGRenderStyle::setMarkerMidResource(const String& resource)
{
    if (!(m_inheritedResourceData->markerMid == resource))
        m_inheritedResourceData.access().markerMid = resource;
}

inline void SVGRenderStyle::setMarkerEndResource(const String& resource)
{
    if (!(m_inheritedResourceData->markerEnd == resource))
        m_inheritedResourceData.access().markerEnd = resource;
}

inline void SVGRenderStyle::setBitDefaults()
{
    m_inheritedFlags.clipRule = static_cast<unsigned>(initialClipRule());
    m_inheritedFlags.fillRule = static_cast<unsigned>(initialFillRule());
    m_inheritedFlags.shapeRendering = static_cast<unsigned>(initialShapeRendering());
    m_inheritedFlags.textAnchor = static_cast<unsigned>(initialTextAnchor());
    m_inheritedFlags.colorInterpolation = static_cast<unsigned>(initialColorInterpolation());
    m_inheritedFlags.colorInterpolationFilters = static_cast<unsigned>(initialColorInterpolationFilters());
    m_inheritedFlags.glyphOrientationHorizontal = static_cast<unsigned>(initialGlyphOrientationHorizontal());
    m_inheritedFlags.glyphOrientationVertical = static_cast<unsigned>(initialGlyphOrientationVertical());

    m_nonInheritedFlags.flags = 0;
    m_nonInheritedFlags.flagBits.alignmentBaseline = static_cast<unsigned>(initialAlignmentBaseline());
    m_nonInheritedFlags.flagBits.dominantBaseline = static_cast<unsigned>(initialDominantBaseline());
    m_nonInheritedFlags.flagBits.baselineShift = static_cast<unsigned>(initialBaselineShift());
    m_nonInheritedFlags.flagBits.vectorEffect = static_cast<unsigned>(initialVectorEffect());
    m_nonInheritedFlags.flagBits.bufferedRendering = static_cast<unsigned>(initialBufferedRendering());
    m_nonInheritedFlags.flagBits.maskType = static_cast<unsigned>(initialMaskType());
}

} // namespace WebCore
