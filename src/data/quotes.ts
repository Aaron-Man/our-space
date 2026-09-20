export interface Quote {
  text: string;
  text_cn?: string;
  author?: string;
  origin?: string;
}

export const quotes: Quote[] = [
  // 中文经典
  { text: '山有木兮木有枝，心悦君兮君不知', origin: '中国·越人歌' },
  { text: '愿得一心人，白首不相离', origin: '中国·卓文君' },
  { text: '人生若只如初见，何事秋风悲画扇', author: '纳兰性德', origin: '中国' },
  { text: '死生契阔，与子成说', origin: '中国·诗经' },
  { text: '执子之手，与子偕老', origin: '中国·诗经' },
  { text: '两情若是久长时，又岂在朝朝暮暮', author: '秦观', origin: '中国' },
  { text: '曾经沧海难为水，除却巫山不是云', author: '元稹', origin: '中国' },
  { text: '玲珑骰子安红豆，入骨相思知不知', author: '温庭筠', origin: '中国' },
  { text: '只愿君心似我心，定不负相思意', author: '李之仪', origin: '中国' },
  { text: '身无彩凤双飞翼，心有灵犀一点通', author: '李商隐', origin: '中国' },
  { text: '春蚕到死丝方尽，蜡炬成灰泪始干', author: '李商隐', origin: '中国' },
  { text: '在天愿作比翼鸟，在地愿为连理枝', author: '白居易', origin: '中国' },
  { text: '众里寻他千百度，蓦然回首，那人却在灯火阑珊处', author: '辛弃疾', origin: '中国' },
  { text: '问世间情为何物，直教人生死相许', author: '元好问', origin: '中国' },
  { text: '衣带渐宽终不悔，为伊消得人憔悴', author: '柳永', origin: '中国' },

  // 中文现代
  { text: '我行过许多地方的桥，看过许多次数的云，却只爱过一个正当最好年龄的人', author: '沈从文', origin: '中国' },
  { text: '草在结它的种子，风在摇它的叶子，我们站着，不说话，就十分美好', author: '顾城', origin: '中国' },
  { text: '从前的日色变得慢，车、马、邮件都慢', author: '木心', origin: '中国' },
  { text: '你是人间的四月天', author: '林徽因', origin: '中国' },
  { text: '我这一生都是坚定不移的唯物主义者，唯有你，我希望有来生', author: '周恩来', origin: '中国' },
  { text: '醒来觉得甚是爱你', author: '朱生豪', origin: '中国' },
  { text: '我一天一天明白你的平凡，同时却一天一天愈更深切地爱你', author: '朱生豪', origin: '中国' },

  // 日本文学
  { text: '今晚月色真美', author: '夏目漱石', origin: '日本' },
  { text: '生而为人，我很抱歉', author: '太宰治', origin: '日本' },
  { text: '世间万物不及你眼中星辰', origin: '日本' },
  { text: '比起爱情，我更想和你一起吃饭', origin: '日本' },
  { text: '所谓世界，不过是一扇扇打开的门', author: '村上春树', origin: '日本' },

  // 英语经典
  { text: 'In the middle of every difficulty lies a possibility', author: 'Einstein', origin: 'English' },
  { text: 'Life is what happens when you\'re busy making other plans', author: 'John Lennon', origin: 'English' },
  { text: 'The best thing to hold onto in life is each other', author: 'Audrey Hepburn', origin: 'English' },
  { text: 'You know you\'re in love when you can\'t fall asleep because reality is finally better than your dreams', author: 'Dr. Seuss', origin: 'English' },
  { text: 'I have waited for this opportunity for more than half a century, to repeat to you once again my vow of eternal fidelity and everlasting love', author: 'Gabriel García Márquez', origin: 'English' },
  { text: 'Whatever our souls are made of, his and mine are the same', author: 'Emily Brontë', origin: 'English' },
  { text: 'It is only with the heart that one can see rightly', author: 'Saint-Exupéry', origin: 'English' },
  { text: 'I would rather share one lifetime with you than face all the ages of this world alone', origin: 'The Lord of the Rings' },
  { text: 'To the world you may be one person, but to one person you may be the world', origin: 'English' },

  // 法语 Français
  { text: 'La vie est belle', origin: 'Français', text_cn: '生活是美好的' },
  { text: 'Je t\'aime à la folie', origin: 'Français', text_cn: '我疯狂地爱你' },
  { text: 'Le cœur a ses raisons que la raison ne connaît point', author: 'Pascal', origin: 'Français', text_cn: '心有其理，非理所能知' },
  { text: 'Vivre est la chose la plus rare du monde. La plupart des gens existent, c\'est tout', author: 'Oscar Wilde', origin: 'Français', text_cn: '活着是世上最罕见的事，大多数人只是在存在而已' },
  { text: 'Il n\'y a qu\'un bonheur dans la vie, c\'est d\'aimer et d\'être aimé', author: 'George Sand', origin: 'Français', text_cn: '生命中唯一的幸福，就是爱与被爱' },
  { text: 'La simplicité est la sophistication suprême', author: 'Leonardo da Vinci', origin: 'Français', text_cn: '简约是极致的精致' },
  { text: 'Soyez le changement que vous voulez voir dans le monde', author: 'Gandhi', origin: 'Français', text_cn: '成为你想在世界上看到的改变' },
  { text: 'La plus grande gloire pour un homme n\'est pas de ne jamais tomber, mais de se relever à chaque chute', author: 'Confucius', origin: 'Français', text_cn: '人最大的荣耀不在于从不跌倒，而在于每次跌倒都能站起' },
  { text: 'Aimer, ce n\'est pas se regarder l\'un l\'autre, c\'est regarder ensemble dans la même direction', author: 'Saint-Exupéry', origin: 'Français', text_cn: '爱不是彼此凝视，而是一起朝同一个方向看' },
  { text: 'Le voyage est une porte de sortie sur la vie', author: 'Romain Gary', origin: 'Français', text_cn: '旅行是通往生活的一扇出口' },
  { text: 'Les voyages forment la jeunesse', origin: 'Français', text_cn: '旅行塑造青春' },
  { text: 'La liberté commence par un refus', author: 'Albert Camus', origin: 'Français', text_cn: '自由始于拒绝' },
  { text: 'Au milieu de l\'hiver, j\'apprenais enfin qu\'il y avait en moi un été invincible', author: 'Albert Camus', origin: 'Français', text_cn: '在隆冬，我终于知道，我身上有一个不可战胜的夏天' },
  { text: 'L\'essentiel est invisible pour les yeux', author: 'Saint-Exupéry', origin: 'Français', text_cn: '重要的东西用眼睛是看不见的' },
  { text: 'Chaque instant de la vie est un miracle', origin: 'Français', text_cn: '生命的每一刻都是奇迹' },

  // 意大利语 Italiano
  { text: 'La vita è troppo breve per essere piccola', author: 'Benjamin Disraeli', origin: 'Italiano', text_cn: '人生太短暂，不能活得渺小' },
  { text: 'Se sai perché ti innamori, non ti innamori', origin: 'Italiano', text_cn: '如果你知道为什么而爱，你就不会爱了' },
  { text: 'Chi non vive per servire, non serve per vivere', origin: 'Italiano', text_cn: '不为服务而活的人，活着也没有意义' },
  { text: 'La semplicità è la suprema sofisticazione', author: 'Leonardo da Vinci', origin: 'Italiano', text_cn: '简约是终极的精致' },
  { text: 'Il viaggio è l\'unica cosa che ti rende più ricchi di quanto eri prima', origin: 'Italiano', text_cn: '旅行是唯一能让你比从前更富有的事' },
  { text: 'La vita è come una bicicletta. Per mantenere l\'equilibrio devi continuare a muoverti', author: 'Einstein', origin: 'Italiano', text_cn: '生活就像骑自行车，要保持平衡就必须不断前行' },
  { text: 'Non tutto ciò che luccica è oro', origin: 'Italiano', text_cn: '不是所有发光的东西都是金子' },
  { text: 'Il mondo è un libro e chi non viaggia ne legge solo una pagina', author: 'Sant\'Agostino', origin: 'Italiano', text_cn: '世界是一本书，不旅行的人只读了其中一页' },
  { text: 'L\'arte di vivere è l\'arte di incontrare', author: 'John Donne', origin: 'Italiano', text_cn: '生活的艺术就是相遇的艺术' },
  { text: 'Buona vita non è senza problemi, è saperli superare', origin: 'Italiano', text_cn: '美好生活不是没有问题，而是懂得超越问题' },
  { text: 'Ogni giorno è un nuovo inizio', origin: 'Italiano', text_cn: '每一天都是新的开始' },
  { text: 'Il tempo che ami perdere non è tempo perso', origin: 'Italiano', text_cn: '你甘愿浪费的时间不算浪费' },

  // 西班牙语 Español
  { text: 'Te amo como la luna ama al mar', origin: 'Español', text_cn: '我爱你，如月亮爱着大海' },
  { text: 'Donde hay amor, hay vida', author: 'Gandhi', origin: 'Español', text_cn: '哪里有爱，哪里就有生命' },
  { text: 'La vida es un viaje, no un destino', origin: 'Español', text_cn: '生活是一场旅行，不是目的地' },
  { text: 'No hay camino hacia la felicidad, la felicidad es el camino', author: 'Buda', origin: 'Español', text_cn: '没有通往幸福的道路，幸福本身就是道路' },
  { text: 'El mejor viaje es el que aún no has hecho', origin: 'Español', text_cn: '最好的旅行是你还未曾踏上的那段' },
  { text: 'La vida es demasiado corta para ser miserable', origin: 'Español', text_cn: '人生太短，不值得难过' },
  { text: 'A veces se gana, otras se aprende', origin: 'Español', text_cn: '有时候你会赢，有时候你会学到东西' },
  { text: 'Los sueños no funcionan a menos que tú lo hagas', author: 'Walt Disney', origin: 'Español', text_cn: '梦想不会自己实现，除非你行动' },
  { text: 'Viajar es vivir', author: 'Hans Christian Andersen', origin: 'Español', text_cn: '旅行就是活着' },
  { text: 'No dejes que el miedo a perder impida que juegues', origin: 'Español', text_cn: '不要让害怕失去阻碍你全力以赴' },
  { text: 'La felicidad no es algo hecho. Viene de tus propias acciones', author: 'Dalai Lama', origin: 'Español', text_cn: '幸福不是现成的，它来自你自己的行动' },
  { text: 'Cada día es una nueva oportunidad para cambiar tu vida', origin: 'Español', text_cn: '每一天都是改变生活的新机会' },
  { text: 'El amor no se mira, se siente', origin: 'Español', text_cn: '爱不是用来看的，是用来感受的' },
  { text: 'Lo que no se nombra no existe', author: 'Julio Cortázar', origin: 'Español', text_cn: '未被命名的事物不存在' },
  { text: 'Anda, y vive tu propia vida', origin: 'Español', text_cn: '走吧，去过你自己的生活' },

  // 俄语 Русский
  { text: 'Без труда не выловишь и рыбку из пруда', origin: 'Русский', text_cn: '不付出劳动，就从池塘里捞不出鱼来' },
  { text: 'Жизнь прожить — не поле перейти', origin: 'Русский', text_cn: '度过一生，不像穿越田野那样简单' },
  { text: 'Кто не работает, тот не ест', origin: 'Русский', text_cn: '不劳动的人不配吃饭' },
  { text: 'Любовь спасёт мир', origin: 'Русский', text_cn: '爱将拯救世界' },
  { text: 'Счастье не за горами', origin: 'Русский', text_cn: '幸福并不遥远' },
  { text: 'Дорогу осилит идущий', origin: 'Русский', text_cn: '走下去的人才能走完这条路' },
  { text: 'Век живи — век учись', origin: 'Русский', text_cn: '活到老，学到老' },
  { text: 'Слово не воробей, вылетит — не поймаешь', origin: 'Русский', text_cn: '话一出口，如鸟飞走，再也收不回' },
  { text: 'Всё проходит, и это пройдёт', origin: 'Русский', text_cn: '一切都会过去，这也会过去' },
  { text: 'Красота спасёт мир', author: 'Достоевский', origin: 'Русский', text_cn: '美将拯救世界' },
  { text: 'Человек — это звучит гордо', author: 'Горький', origin: 'Русский', text_cn: '人——这个称号听起来多么自豪' },
  { text: 'Чтобы хотеть жить, надо жить для других', author: 'Толстой', origin: 'Русский', text_cn: '要想热爱生活，就要为别人而活' },
  { text: 'Нет ничего прекраснее и сильнее человека', author: 'Горький', origin: 'Русский', text_cn: '没有什么比人更美好、更强大' },
  { text: 'Любить — значит жить жизнью того, кого любишь', author: 'Толстой', origin: 'Русский', text_cn: '爱，就是活在你所爱之人的生命里' },
  { text: 'Путешествия — это единственная вещь, покупая которую, становишься богаче', origin: 'Русский', text_cn: '旅行是唯一花了钱还能让你更富有的事' },

  // 韩语
  { text: '너와 함께라면 어디든 좋아', origin: '한국어', text_cn: '和你在一起，哪里都好' },

  // 哲理与生活
  { text: '生活不是等待暴风雨过去，而是学会在雨中跳舞', origin: '谚语' },
  { text: '把每一天当作最后一天来过，终有一天你会发现自己是对的', origin: '谚语' },
  { text: '世界上最美好的事情，就是和你一起走过每一个平凡的日子', origin: '佚名' },
  { text: '陪伴是最长情的告白', origin: '佚名' },
  { text: '所谓岁月静好，不过是有人替你负重前行', origin: '佚名' },
  { text: '所有的相遇，都是久别重逢', origin: '佚名' },
  { text: '人间烟火气，最抚凡人心', origin: '佚名' },
  { text: '柴米油盐酱醋茶，人间有味是清欢', origin: '苏轼（改编）' },
  { text: '晚来天欲雪，能饮一杯无', author: '白居易', origin: '中国' },
  { text: '采菊东篱下，悠然见南山', author: '陶渊明', origin: '中国' },
  { text: '家人闲坐，灯火可亲', author: '汪曾祺', origin: '中国' },
  { text: '四方食事，不过一碗人间烟火', author: '汪曾祺', origin: '中国' },

  // 食物与生活
  { text: '好好吃饭，好好生活', origin: '佚名' },
  { text: '人间值得，未来可期', origin: '佚名' },
  { text: '今天也是元气满满的一天', origin: '日本' },
  { text: '小确幸，是生活中小小的幸福', origin: '村上春树（改编）' },
  { text: '幸福就是猫吃鱼，狗吃肉，奥特曼打小怪兽', origin: '网络' },

  // 旅行与远方
  { text: '世界那么大，我想去看看', origin: '网络' },
  { text: '生活不止眼前的苟且，还有诗和远方', origin: '高晓松' },
  { text: '一个人的旅行，在路上遇见最真实的自己', author: '安妮宝贝', origin: '中国' },
  { text: '旅行的意义不在于寻找新的风景，而在于获得新的眼光', author: 'Marcel Proust', origin: 'English' },

  // 季节与自然
  { text: '春天适合努力和拥抱', origin: '佚名' },
  { text: '夏天的风，我永远记得', origin: '佚名' },
  { text: '秋天是倒放的春天', origin: '佚名' },
  { text: '冬天从这里夺去的，春天会交还给你', author: '海涅', origin: 'Deutsch' },

  // 云南保山方言
  { text: '今天天气板扎得很，出去转转嘛', origin: '保山方言', text_cn: '今天天气特别好，出去逛逛吧' },
  { text: '慢点嘛，饭要一口一口吃，路要一步一步走', origin: '保山方言', text_cn: '慢一点，饭要一口一口吃，路要一步一步走' },
  { text: '你整哪样嘛，快来吃饭了', origin: '保山方言', text_cn: '你在干什么呢，快来吃饭了' },
  { text: '日子嘛，就是要过得有滋有味的', origin: '保山方言', text_cn: '日子嘛，就是要过得有滋有味的' },
  { text: '莫着急，好饭不怕晚', origin: '保山方言', text_cn: '别着急，好饭不怕晚' },
  { text: '人活一世，草长一春，开心最重要', origin: '保山方言', text_cn: '人活一世，草长一春，开心最重要' },
  { text: '该吃吃该喝喝，遇啥事别往心里搁', origin: '保山方言', text_cn: '该吃吃该喝喝，遇啥事别往心里搁' },
  { text: '你给吃饭了？走，克哪点耍', origin: '保山方言', text_cn: '你吃饭了吗？走，去哪里玩' },
  { text: '日子要慢慢过，急不得，也等不得', origin: '保山方言', text_cn: '日子要慢慢过，急不得，也等不得' },
  { text: '吃饱了才有力气想事情嘛', origin: '保山方言', text_cn: '吃饱了才有力气想事情嘛' },
  { text: '一家人在一起，比哪样都强', origin: '保山方言', text_cn: '一家人在一起，比什么都强' },
  { text: '天气好了就出去晒晒太阳，人要学会享受', origin: '保山方言', text_cn: '天气好了就出去晒晒太阳，人要学会享受' },
  { text: '忙哪样嘛，坐下喝杯茶先', origin: '保山方言', text_cn: '忙什么呢，坐下喝杯茶先' },
  { text: '做人嘛，最要紧的就是开心', origin: '保山方言', text_cn: '做人嘛，最要紧的就是开心' },
  { text: '哪样好吃？妈妈做的饭最好吃', origin: '保山方言', text_cn: '什么好吃？妈妈做的饭最好吃' },
  { text: '不消愁，明天又是新的一天', origin: '保山方言', text_cn: '不用愁，明天又是新的一天' },
  { text: '小日子过得舒舒服服的，就是福气', origin: '保山方言', text_cn: '小日子过得舒舒服服的，就是福气' },
  { text: '你给高兴？高兴就好，人生苦短', origin: '保山方言', text_cn: '你开心吗？开心就好，人生苦短' },

  // 歌词
  { text: '我能想到最浪漫的事，就是和你一起慢慢变老', origin: '《最浪漫的事》' },
  { text: '后来，终于在眼泪中明白，有些人一旦错过就不再', origin: '《后来》·刘若英' },
  { text: '我愿意为你，我愿意为你，我愿意为你被放逐天际', origin: '《我愿意》·王菲' },
  { text: '确认过眼神，我遇上对的人', origin: '《醉赤壁》·林俊杰' },
  { text: '从前从前有个人爱你很久，但偏偏风渐渐把距离吹得好远', origin: '《晴天》·周杰伦' },
  { text: '陪你把沿路感想活出了答案，陪你把独自孤单叫作勇敢', origin: '《陪你度过漫长岁月》·陈奕迅' },
  { text: '你是我的眼，带我领略四季的变换', origin: '《你是我的眼》·萧煌奇' },
  { text: '终于等到你，还好我没放弃', origin: '《终于等到你》·张靓颖' },
  { text: '我来到你的城市，走过你来时的路', origin: '《好久不见》·陈奕迅' },
  { text: '愿你被这个世界温柔以待', origin: '《起风了》·买辣椒也用券' },
  { text: '我曾难自拔于世界之大，也沉溺于其中梦话', origin: '《起风了》·买辣椒也用券' },
  { text: '你说你有点难追，我就有点想放弃', origin: '《有点甜》·汪苏泷' },
  { text: '最美的不是下雨天，是曾与你躲过雨的屋檐', origin: '《不能说的秘密》·周杰伦' },
  { text: '为你弹奏肖邦的夜曲，纪念我死去的爱情', origin: '《夜曲》·周杰伦' },
  { text: '故事的小黄花，从出生那年就飘着', origin: '《晴天》·周杰伦' },
  { text: '天青色等烟雨，而我在等你', origin: '《青花瓷》·周杰伦' },
  { text: '你笑起来真像好天气', origin: '《你笑起来真好看》' },
  { text: '生活不止眼前的苟且，还有诗和远方的田野', origin: '《生活不止眼前的苟且》·许巍' },
  { text: '曾梦想仗剑走天涯，看一看世界的繁华', origin: '《蓝莲花》·许巍' },
  { text: '没有什么能够阻挡，我对自由的向往', origin: '《蓝莲花》·许巍' },
  { text: '我要稳稳的幸福，能抵挡末日的残酷', origin: '《稳稳的幸福》·陈奕迅' },
  { text: '我要和你一起去流浪，流浪到那遥远的地方', origin: '《流浪》·半阳' },
  { text: '我多想再见你，哪怕匆匆一眼就别离', origin: '《我多想再见你》·陈鸿宇' },
  { text: '你知道的越多，你知道的就越少', origin: '《The More You Know》' },

  // 问答式 · 日常互动
  { text: '今天想去哪里耍呀？', origin: '日常' },
  { text: '今晚吃哪样？我想吃火锅', origin: '日常' },
  { text: '周末要不要去爬山？', origin: '日常' },
  { text: '你猜我今天遇到啥子好事了？', origin: '日常' },
  { text: '想你了，你在干嘛呀？', origin: '日常' },
  { text: '要不要一起看个电影？', origin: '日常' },
  { text: '今天天气好好，出去走走吧？', origin: '日常' },
  { text: '你饿不饿？我去给你弄点吃的', origin: '日常' },
  { text: '猜猜我手里有什么？', origin: '日常' },
  { text: '你说，我们下次旅行去哪里好呢？', origin: '日常' },
  { text: '今天辛苦啦，给你揉揉肩', origin: '日常' },
  { text: '早安呀，今天也要加油哦', origin: '日常' },
  { text: '晚安，做个好梦，明天见', origin: '日常' },
  { text: '你最近是不是又偷偷变好看了？', origin: '日常' },
  { text: '我们来数数在一起多少天了吧？', origin: '日常' },
  { text: '你说，今晚是吃米线还是吃饭？', origin: '日常' },
  { text: '要不要去超市买点零食？', origin: '日常' },
  { text: '你听说了吗？最近有个地方好漂亮', origin: '日常' },
  { text: '我给你讲个笑话吧，保证你笑到肚子疼', origin: '日常' },
  { text: '今天的工作顺利吗？回来跟我说说', origin: '日常' },
];

export function getRandomQuote(excludeIndex?: number): { quote: Quote; index: number } {
  let index: number;
  do {
    index = Math.floor(Math.random() * quotes.length);
  } while (index === excludeIndex && quotes.length > 1);
  return { quote: quotes[index], index };
}
