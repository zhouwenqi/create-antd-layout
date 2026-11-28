import type { LocaleMessage } from "@adminui-dev/antd-layout"
import antdZhCN from 'antd/locale/zh_CN'
import antdEnUS from 'antd/locale/en_US'
import zhCN from "@/locales/zh-CN"
import enUS from "@/locales/en-US"

export const localeMessages:Record<string,LocaleMessage> = {   
    "zh-CN":{
        locale:antdZhCN.locale,
        name:"简体中文",
        flag:"🇨🇳",
        messages:zhCN,            
        antdLocale:antdZhCN
    },
    "en-US":{
        locale:antdEnUS.locale,
        name:"English",
        flag:"🇺🇸",
        messages:enUS,
        antdLocale:antdEnUS
    },
}