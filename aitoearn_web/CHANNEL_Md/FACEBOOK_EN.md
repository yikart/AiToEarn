# Facebook Developer App Guide

1. Visit Meta Developer Center and click Create App
   ![step1](images/facebook/step_1_create_app.png)
2. Select "Other" and click Next
   ![step2](images/facebook/step_2_use_case_list.png)
   ![step3](images/facebook/step_3_add_use_case.png)
3. Select app type Business
   ![step4](images/facebook/step_4_select_app_type.png)
4. Fill in App Details and click Create App
   ![step5](images/facebook/step_5_app_detail.png)
5. Enter app dashboard
   ![step6](images/facebook/step_6_product_list.png)
6. Find Facebook Login For Business in the product list and click Setup
   ![step8](images/facebook/step_8_select_product.png)
7. Fill in information on the product settings page and set redirect URIs
   ![step9](images/facebook/step_10_facebook_settings.png)
8. Click App Review in the left menu and select Permissions and Features
   ![step10](images/facebook/step_13_add_permissions.png)
    Apply for the following scopes:
    1. pages_show_list, business_management, pages_manage_posts, pages_manage_engagement, pages_read_engagement, read_insights
9. Switch App Mode from development to Live
    1. If this app is only for your own use, no review is required
    2. If this app also needs to be provided to other users, you need to complete app requests review in App Review - Requests according to Meta's review requirements
10. Copy the App ID and App Secret from App Settings to the project configuration file. Now the Facebook platform publishing function is ready to use
    ![step11](images/facebook/step_14_app_settings.png)
