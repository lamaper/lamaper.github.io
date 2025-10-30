+++
date = '2025-04-06T23:50:00+08:00'
draft = false
title = '2025数学建模第一次校赛'
tags = ['mm', 'python','math']
categories = ['mathematics modeling']
math = true
+++

### Intro

清明节献祭了假期，来打建模大赛。第一次打建模，实际上处于一个什么都不会的状态，全靠大语言模型来协助与学习。但是仔细思考过后，我认为自己不应该做一个知识的搬运工，既然搬运都搬运了，那就在这过程中把能学的都学会，不然最后的收获就是零蛋。

抱着这个想法，开始复盘一下这次数学建模的历程，看看能从中学到什么。

> **2025年北京理工大学数学建模竞赛A题 租房价格**
>
>  
>
> Airbnb 作为全球领先的短租平台，其房源价格受多种因素影响，包括地理位置、房源属性、市场供需关系及房东经营策略等。合理的定价不仅影响房东的收益，也直接关系到房源的入住率和市场竞争力。请基于2024年纽约市 Airbnb 房源数据，针对平台上房源经营与定价问题展开深入研究。
>
> 参赛者需基于附件1所给数据，建立数学模型回答如下问题：
>
> 对原始数据进行预处理，包括缺失、异常与重复数据的检测与处理，并说明判断缺失、异常的理由以及处理的方法。利用描述性统计分析，定量地呈现数据各指标的分布特性和基本统计规律。针对房源在不同维度上的表现，分析各个细分市场的特征、分布规律及其潜在的经营价值，为制定针对性策略提供理论依据。分析地理位置及其他相关变量对房价、入住率的影响，给出空间自相关性和地理位置的差异对房价、入住率的影响，揭示各因素之间的内在联系。考虑不同细分市场和区域之间的差异性，给出兼顾收益与入住率的最优定价策略。策略实施过程中可能面临哪些风险？请给出相应的改进方向。
>
>  
>
> 附件1中各字段的意义解释：
>
> **id**：每个房源的唯一标识符，用于区分不同的房源。
>
> **name**：房源的名称或标题，通常由房东设置，用以描述房源特点或吸引住客。
>
> **host_id**：房东的唯一标识符，每个房东对应一个 host_id，用来关联同一房东的多个房源。
>
> **host_name**：房东的名称，有时是昵称或真实姓名，便于识别房东。
>
> **neighbourhood_group**：较大区域的分组，在纽约市中通常指曼哈顿、布鲁克林、皇后区等大区。
>
> **neighbourhood**：具体的街区或小区域，标识房源所在的更细致位置。
>
> **latitude**：房源位置的纬度坐标，用于在地图上定位。
>
> **longitude**：房源位置的经度坐标，同样用于地理定位。
>
> **room_type**：房间类型，常见的有整套房源、私人房间和共享房间，反映住客能享受的空间类型。
>
> **price**：房源每晚的租金价格，通常以美元为单位。
>
> **minimum_nights**：预订该房源所要求的最少入住夜数。
>
> **number_of_reviews**：房源累计获得的评价数量，反映住客的反馈记录。
>
> **last_review**：最近一次评价的日期，表示最近一次住客反馈的时间。
>
> **reviews_per_month**：平均每月收到的评价数量，可以反映房源的预订活跃度。
>
> **calculated_host_listings_count**：房东在平台上所发布的房源数量，展示房东的房源管理规模。
>
> **availability_365**：表示房源在一年中可供预订的天数，用于衡量房源的空置率或使用率。
>
> **number_of_reviews_ltm**：最近12个月内获得的评价数量，反映近期的预订情况和住客反馈。
>
> **license**：房源的营业执照或许可号码（若有提供），用于证明房源符合当地的出租规定和法规要求。

首先对赛题进行拆解，个人认为这个赛题十分人性化了，已经把该给到的都给了。最终经过分析，我们队伍把问题拆分成了如下几点：

> 1-1 对原始数据进行**预处理**：包括缺失、异常与重复数据的检测与处理
>
> 1-2 说明判断缺失、异常的理由以及处理方法
>
> 1-3 利用**描述性统计**分析，定量地呈现数据各指标的分布特性和基本统计规律
>
> 2-1 针对房源在**不同维度**上的表现
>
> 2-2 分析各个**细分市场**的特征、分布规律及其潜在经营价值
>
> 2-3 为制定针对性策略提供**理论依据**
>
> 3-1 分析地理位置及其他相关变量对房价、入住率的**影响**
>
> 3-2 给出空间自相关性和地理位置的差异对房价、入住率的影响
>
> 3-3 揭示各因素(3-1 & 3-2)之间的**内在联系**
>
> 4-1 考虑(不同细分市场的差异性)和(不同区域之间的差异性)
>
> 给出**兼顾**收益**与**入住率的最优**定价策略**
>
> 4-2 思考策略实施过程中可能面临的**风险**,并给出相应的**改进方向**

之后就开始~~愉快地~~工作。首先是数据处理，为了让论文更加的高大上，我们决定来点骚的，看上去厉害的方法。在大语言模型的建议下，我们采用了多重插补法（MICE）对数据进行处理。

### Multiple Imputation by Chained Equations

> MICE（Multiple Imputation by Chained Equations）是一种基于贝叶斯思想的多重插补技术，用于处理缺失数据。它的基本原理是通过多次迭代，根据已有数据的信息来估计缺失值，并且不断更新估计模型。具体地，MICE将变量分为两类：需要插值的目标变量和其他辅助变量。然后，对于每个目标变量，MICE利用其他辅助变量的信息来进行插值，并不断迭代，直到收敛为止。

[从mice到missForest：常用数据插值方法优缺点 - 知乎](https://zhuanlan.zhihu.com/p/673954517)的3.1部分介绍了这一技术的详细原理。MICE具有灵活性，能够根据数据集的特点进行模型选择和参数调整，同时对于缺失模式的敏感性较低。但在处理非线性关系和大规模数据集时表现一般。这里主要对如何进行MICE进行讨论和研究，以确保这个方法有可复现性。

首先需要导入两个基本的库`pandas`和`numpy`，然后使用`statsmodels.imputation.mice`的mice模块来进行真正的插补操作。

```python
import pandas as pd
import numpy as np
from statsmodels.imputation.mice import MICEData
from sklearn.preprocessing import OrdinalEncoder
```

由于该算法通常需要数值型输入，其内部模型（如线性回归、决策树等）依赖数值计算，所以还要对非数值内容进行编码，使其变为数值，这里用到了`sklearn.preprocessing`

```python
# 读取原始数据
raw_data = pd.read_csv('data_FIX.csv')
np.random.seed(2024)
# ===== 数据预处理阶段 =====
# 1. 保留所有原始字段
data = raw_data.copy()

# 2. 处理时间特征（不删除原列）
max_date = pd.to_datetime(data['last_review']).max()
data['last_review_days'] = (max_date - pd.to_datetime(data['last_review'])).dt.days
data['license'] = data['license'].fillna('UNLICENSED')
# 3. 编码分类变量（创建副本列进行编码）
geo_encoder = OrdinalEncoder()
room_type_encoder = OrdinalEncoder()

# 创建编码副本列
data[['ng_encoded', 'n_encoded']] = geo_encoder.fit_transform(data[['neighbourhood_group', 'neighbourhood']])
data['rt_encoded'] = room_type_encoder.fit_transform(data[['room_type']])
```

之后开始核心的插补过程。在官方文档中，可以找到每个参数的意义[statsmodels.imputation.mice.MICE - statsmodels 0.14.4](https://www.statsmodels.org/stable/generated/statsmodels.imputation.mice.MICE.html)，文档规定了MICE的代码如下：

```python
class statsmodels.imputation.mice.MICEData(data,
            perturbation_method='gaussian',
            k_pmm=20,
            history_callback=None)
```

| 参数                | 类型                      | 含义                                                         |
| ------------------- | ------------------------- | ------------------------------------------------------------ |
| data                | `Pandas` ,`data` ,`frame` | The data set, which is copied internally.这里是值传递        |
| perturbation_method | `str`                     | The default perturbation method.即默认的扰动模型，这里默认为高斯扰动。另外还可以选择boot模型， |
| k_pmm               | `int`                     | The number of nearest neighbors to use during predictive mean matching. PMM是一种基于模型的数据插补方法，它通过建立预测模型来预测缺失值，并根据预测结果从已有的观察值中选择一个最接近的均值进行匹配。 K_pmm=20表示从预测均值最近的 20 个观测值中随机选择一个作为插补值。 |
| history_callback    | function                  | 规定了是否需要返回操作记录。                                 |

```python
# ===== 多重插补实现 =====
# 选择需要插补的数值列
impute_columns = ['price', 'minimum_nights', 'number_of_reviews', 
                 'reviews_per_month', 'calculated_host_listings_count',
                 'availability_365', 'number_of_reviews_ltm', 'last_review_days',
                 'ng_encoded', 'n_encoded', 'rt_encoded']

# 执行MICE插补
imp = MICEData(data[impute_columns], perturbation_method='gaussian', k_pmm=5)
for _ in range(5):
    imp.update_all()

# 合并插补结果
imputed_data = data.copy()
imputed_data[impute_columns] = imp.data
```

然后是后处理阶段。

```python
# ===== 后处理阶段 =====
# 1. 恢复分类变量
imputed_data[['neighbourhood_group', 'neighbourhood']] = geo_encoder.inverse_transform(
    imputed_data[['ng_encoded', 'n_encoded']])
imputed_data['room_type'] = room_type_encoder.inverse_transform(
    imputed_data[['rt_encoded']]).flatten()

# 2. 恢复last_review日期
imputed_data['last_review'] = np.where(
    imputed_data['last_review'].isna(),
    (max_date - pd.to_timedelta(imputed_data['last_review_days'], unit='D')).dt.strftime('%Y-%m-%d'),
    imputed_data['last_review']
)

# 3. 清理中间列
imputed_data = imputed_data.drop(['ng_encoded', 'n_encoded', 'rt_encoded', 'last_review_days'], axis=1)
#价格异常值处理
imputed_data = imputed_data[(imputed_data['price'] > 0) & (imputed_data['price'] < 10000)]
# 保存结果
imputed_data.to_csv('imputed_data_FIX_full.csv', index=False)
```

### Matplotlib

最终还有一个绘图，这里用到了`matplotlib`

```python
# 绘制价格分布对比图
import matplotlib.pyplot as plt

plt.rcParams["font.sans-serif"] = ["SimHei"]  # 设置字体
plt.rcParams["axes.unicode_minus"] = False  # 正常显示负号
plt.figure(figsize=(12, 6))

# 原始数据分布
plt.subplot(1, 2, 1)
raw_data['price'].hist(bins=50, range=(0, 2500))  # 直接限定数据范围
plt.title(f'原始价格分布 (n={len(raw_data)})')
plt.xlabel('Price (USD)')
plt.ylabel('frequency')
plt.xlim(0, 2500)  # 双重保险设置显示范围[5,7](@ref)

# 插补后数据分布
plt.subplot(1, 2, 2)
imputed_data['price'].hist(bins=50, range=(0, 2500))
plt.title(f'插补后价格分布 (n={len(imputed_data)})')
plt.xlabel('Price (USD)')
plt.xlim(0, 2500)  # 同步设置显示范围

plt.tight_layout()  # 自动调整子图间距
plt.savefig('output_FIX.png', dpi=300, bbox_inches='tight')
```

这里要特别非常强调一个问题，matplotlib默认的中文绘图需要自己的电脑带有中文字体，否则会出现很多麻烦的问题。

我的环境是Windows11 23H2工作站版下的WSL2 Ubuntu24.02 LTSC，虽然系统已经是中文版，但并不带有中文字体。一开始我在这个问题上折腾了很久。[百分百解决你的matplotlib画图中文乱码问题 - 知乎](https://zhuanlan.zhihu.com/p/566430362)，在这个文档的帮助下，得以解决问题，为了防止原文被删，这里引用一下原文：

>### 解决方案
>
>1. 首先**删除你的缓存**。找到你的缓存
>
>```text
>import matplotlib as mpl
>print(mpl.get_cachedir())
># /Users/xiewenwen/.matplotlib
>```
>
>我的缓存文件夹是：/Users/xiewenwen/.matplotlib
>
>删除这个缓存文件夹：rm -rf /Users/xiewenwen/.matplotlib/*
>
>有评论说删除缓存就可以了，你也可以试一试。
>
>2.下载SeiHei.ttf字体放入~**/.fonts**目录下。
>
>或者复制这个链接下载
>
>```text
>http://139.199.170.86/downloads/SimHei.ttf
>```
>
>安装SimHei的命令：
>
>```text
>（1）cd ~/.fonts 。如果没有就mkdir ~/.fonts
>（2）wget http://139.199.170.86/downloads/SimHei.ttf
>（3）安装fc-cache的命令
>    # 如果你是centos 
>    sudo yum install fontconfig -y
>    # 如果你是ubuntu
>    sudo apt-get install fontconfig -y
>    # 如果你是mac
>    brew install fontconfig
>（4）再执行 fc-cache -fv    刷新字体缓存
>```

### 随机森林

在最后一个问题中，我们使用了随机森林的方法来寻找最优解，随机森林核心参数如下：

| 参数               | 意义                                   | 调参建议                                                |
| :----------------- | :------------------------------------- | :------------------------------------------------------ |
| `n_estimators`     | 决策树的数量                           | 增加树的数量提升稳定性，但计算成本增加（通常100-500）。 |
| `max_depth`        | 单棵树的最大深度                       | 过大导致过拟合，过小导致欠拟合（常用5-20）。            |
| `min_samples_leaf` | 叶节点所需最小样本数                   | 增大可防止过拟合（常用1-10）。                          |
| `max_features`     | 每棵树分裂时考虑的特征数（默认`auto`） | 减少特征数可降低方差，常用`sqrt(n_features)`。          |
| `n_jobs`           | 并行计算使用的CPU核心数                | 设为-1使用全部核心加速训练。                            |

```python
# -*- coding: utf-8 -*-
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import r2_score, mean_squared_error
from sklearn.preprocessing import OneHotEncoder
import matplotlib.pyplot as plt
plt.rcParams["font.sans-serif"] = ["SimHei"]  # 设置字体
plt.rcParams["axes.unicode_minus"] = False  # 正常显示负号
# --------------------------
# 数据预处理与收益参数计算
# --------------------------
def preprocess_data(filepath):
    # 加载数据
    df = pd.read_csv(filepath)
    
    # 计算入住率 (Occupancy Rate = 1 - availability_365/365)
    df['occupancy_rate'] = 1 - df['availability_365'] / 365
    
    # 定义收益参数
    # 曼哈顿成本最高（参数最低），布鲁克林次之，其他区域更高
    revenue_param_map = {
        'Manhattan':0.374669,
        'Brooklyn': 0.510500,
        'Queens': 0.470317,
        'Bronx': 0.504385,
        'Staten Island': 0.500000
    }
    df['revenue_param'] = df['neighbourhood_group'].map(revenue_param_map)
    
    # 计算收益目标变量 (Revenue = Price * Occupancy Rate * Revenue Parameter)
    df['revenue'] = df['price'] * df['occupancy_rate'] * df['revenue_param']
    
    # 特征选择
    features = df[[
        'neighbourhood_group',  # 大区域分组
        'latitude',             # 纬度
        'longitude',            # 经度
        'room_type',            # 房源类型
        'minimum_nights',       # 最少入住天数
        'number_of_reviews',    # 累计评价数
        'reviews_per_month',    # 每月评价数（反映活跃度）
        'calculated_host_listings_count',  # 房东房源总数
        'availability_365',     # 可预订天数（用于计算入住率）
        'number_of_reviews_ltm',# 近12个月评价数
        'price'                 # 原始价格（作为可调节变量）
    ]]
    
    # 对分类变量进行独热编码
    encoder = OneHotEncoder(sparse_output=False, drop='first')
    encoded_cats = encoder.fit_transform(features[['neighbourhood_group', 'room_type']])
    encoded_df = pd.DataFrame(
        encoded_cats,
        columns=encoder.get_feature_names_out(['neighbourhood_group', 'room_type'])
    )
    
    # 合并数值型特征
    numerical_features = features[[
        'latitude', 'longitude', 'minimum_nights',
        'number_of_reviews', 'reviews_per_month',
        'calculated_host_listings_count', 'number_of_reviews_ltm',
        'price'
    ]]
    processed_features = pd.concat([encoded_df, numerical_features], axis=1)
    
    return df, processed_features, df['revenue']

# --------------------------
# 随机森林建模与评估
# --------------------------
def build_rf_model(features, target):
    # 划分训练集和测试集
    X_train, X_test, y_train, y_test = train_test_split(
        features, target, test_size=0.2, random_state=42
    )
    
    # 初始化随机森林模型
    model = RandomForestRegressor(
        n_estimators=200,
        max_depth=10,
        min_samples_leaf=5,
        random_state=42
    )
    model.fit(X_train, y_train)
    
    # 模型评估
    y_pred = model.predict(X_test)
    print(f"模型性能评估:")
    print(f"R² Score: {r2_score(y_test, y_pred):.3f}")
    print(f"RMSE: {np.sqrt(mean_squared_error(y_test, y_pred)):.1f}")
    
    # 可视化特征重要性
    feat_importance = pd.Series(model.feature_importances_, index=features.columns)
    feat_importance.nlargest(10).plot(kind='barh', title='特征重要性排名')
    plt.savefig('特征重要性排名.png', dpi=300, bbox_inches='tight')
    
    return model

# --------------------------
# 价格优化器
# --------------------------
def optimize_pricing(model, sample_features, original_price, price_range=0.5):
    """
    输入:
        - model: 训练好的随机森林模型
        - sample_features: 单个房源的特征数据（需包含除price外的所有特征）
        - original_price: 当前价格
        - price_range: 价格调整范围比例（默认±50%）
    输出:
        - optimal_price: 最大化收益的最优价格
        - max_revenue: 对应的预测收益
    """
    # 生成价格搜索空间（当前价格的50%~150%）
    price_min = original_price * (1 - price_range)
    price_max = original_price * (1 + price_range)
    prices = np.linspace(price_min, price_max, 100)
    
    # 复制特征并调整价格
    test_data = pd.DataFrame([sample_features] * len(prices))
    test_data['price'] = prices
    
    # 预测收益
    revenues = model.predict(test_data)
    
    # 找到最优价格
    optimal_idx = np.argmax(revenues)
    return prices[optimal_idx], revenues[optimal_idx]

# --------------------------
# 主程序
# --------------------------
if __name__ == "__main__":
    # 数据预处理
    df, features, target = preprocess_data("imputed_data_FIX_full.csv")  # 替换为实际文件路径
    
    # 训练模型
    rf_model = build_rf_model(features, target)
    
    # 示例：优化第100号房源价格
    sample_idx = 100
    sample_data = features.iloc[sample_idx]
    current_price = df.iloc[sample_idx]['price']
    
    optimal_price, max_revenue = optimize_pricing(
        model=rf_model,
        sample_features=sample_data,
        original_price=current_price
    )
    
    # 打印结果
    print("\n=== 价格优化结果 ===")
    print(f"当前价格: ${current_price:.0f}")
    print(f"最优价格: ${optimal_price:.0f}")
    print(f"预测收益提升: {((max_revenue - df.iloc[sample_idx]['revenue']) / df.iloc[sample_idx]['revenue']):.1%}")
    
    # 可视化价格-收益曲线
    price_range = 0.5
    prices = np.linspace(current_price * (1 - price_range), current_price * (1 + price_range), 100)
    test_data = pd.DataFrame([sample_data] * len(prices))
    test_data['price'] = prices

    plt.figure(figsize=(10, 6))
    plt.plot(prices, rf_model.predict(test_data))
    plt.axvline(optimal_price, color='red', linestyle='--')
    plt.xlabel("Price")
    plt.ylabel("Predicted Revenue")
    plt.title("价格与收益关系曲线")
    plt.savefig('价格与收益关系曲线.png', dpi=300, bbox_inches='tight')
```

