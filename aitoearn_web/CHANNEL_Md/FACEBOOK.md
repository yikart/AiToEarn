# Facebook开发者App指南

1. 访问Meta开发者中心, 点击创建app
   ![step1](images/facebook/step_1_create_app.png)
2. 选择"Other"并点击下一步
   ![step2](images/facebook/step_2_use_case_list.png)
   ![step3](images/facebook/step_3_add_use_case.png)
3. 选择应用类型 Business
   ![step4](images/facebook/step_4_select_app_type.png)
4. 填写App Details并点击创建app
   ![step5](images/facebook/step_5_app_detail.png)
5. 进入app dashboard
   ![step6](images/facebook/step_6_product_list.png)
6. 在产品列表中找到Facebook Login For Business, 并点击setup
   ![step8](images/facebook/step_8_select_product.png)
7. 在product设置页面填写信息并设置redirect URIS
   ![step9](images/facebook/step_10_facebook_settings.png)
8. 在左侧菜单栏点击App Review 并选择Permissions and Features
   ![step10](images/facebook/step_13_add_permissions.png)
    申请以下scopes
    1. pages_show_list,business_management, pages_manage_posts, pages_manage_engagement, pages_read_engagement, read_insights
9. 将 App Mode从development切换到Live
    1. 如果该app仅自己使用，则无需进行审核
    2. 如果该app也需要提供给其他人使用，需要在App Review - Requests中按照Meta的审核要求，完成app requests  review
10. 在App settings中复制App ID以及 App Secret到项目的配置文件中，现在Facebook平台的发布功能就已经可以使用了
    ![step11](images/facebook/step_14_app_settings.png)