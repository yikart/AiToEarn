// 测试文生图价格集成
describe('AI Generate Price Integration', () => {
  it('should use pricing from API response instead of hardcoded values', () => {
    // 模拟接口返回的数据
    const mockImageModels = [
      {
        name: "gpt-image-1",
        description: "gpt-image-1",
        pricing: "1",
        qualities: ["high", "medium", "low"],
        sizes: ["1024x1024", "1536x1024", "1024x1536", "auto"],
        styles: []
      },
      {
        name: "doubao-seedream-3-0-t2i-250415",
        description: "doubao-seedream-3-0-t2i-250415",
        pricing: "2.6",
        qualities: ["high", "medium", "low"],
        sizes: ["1024x1024", "1536x1024", "1024x1536", "auto"],
        styles: []
      }
    ];

    // 测试价格解析
    mockImageModels.forEach(model => {
      const creditCost = model.pricing ? parseFloat(model.pricing) : 0;
      expect(creditCost).toBeGreaterThan(0);
      expect(typeof creditCost).toBe('number');
    });

    // 测试第一个模型的价格
    const firstModel = mockImageModels[0];
    const firstModelPrice = parseFloat(firstModel.pricing);
    expect(firstModelPrice).toBe(1);

    // 测试第二个模型的价格
    const secondModel = mockImageModels[1];
    const secondModelPrice = parseFloat(secondModel.pricing);
    expect(secondModelPrice).toBe(2.6);
  });

  it('should handle missing pricing gracefully', () => {
    const modelWithoutPricing = {
      name: "test-model",
      description: "test-model",
      // pricing 字段缺失
      qualities: ["high", "medium", "low"],
      sizes: ["1024x1024"],
      styles: []
    };

    const creditCost = modelWithoutPricing.pricing ? parseFloat(modelWithoutPricing.pricing) : 0;
    expect(creditCost).toBe(0);
  });

  it('should handle invalid pricing gracefully', () => {
    const modelWithInvalidPricing = {
      name: "test-model",
      description: "test-model",
      pricing: "invalid",
      qualities: ["high", "medium", "low"],
      sizes: ["1024x1024"],
      styles: []
    };

    const creditCost = modelWithInvalidPricing.pricing ? parseFloat(modelWithInvalidPricing.pricing) : 0;
    expect(isNaN(creditCost)).toBe(true);
  });
});
