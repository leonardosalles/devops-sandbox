#include <sourcemod>
#include <sdktools>
#include <clientprefs>

public Plugin myinfo = {
    name = "Watercooler Admin Menu",
    author = "Watercooler",
    description = "Admin menu for Watercooler CS2",
    version = "1.0",
    url = ""
};

public void OnPluginStart()
{
    RegConsoleCmd("sm_admin", Command_AdminMenu, "Opens admin menu");
    PrintToServer("[ADMIN MENU] Loaded.");
}

bool IsAdmin(int client)
{
    return CheckCommandAccess(client, "sm_admin", ADMFLAG_GENERIC, true);
}

public Action Command_AdminMenu(int client, int args)
{
    if (client <= 0 || !IsClientInGame(client)) {
        return Plugin_Handled;
    }

    if (!IsAdmin(client)) {
        PrintToChat(client, "[Admin] Você não tem permissão para abrir o menu.");
        return Plugin_Handled;
    }

    ShowAdminMenu(client);
    return Plugin_Handled;
}

void ShowAdminMenu(int client)
{
    Menu menu = new Menu(MenuHandler);

    menu.SetTitle("Admin Menu Watercooler");

    menu.AddItem("kickbots", "Kick Bots");
    menu.AddItem("endwarmup", "End Warmup");
    menu.AddItem("restart", "Restart Game");

    menu.AddItem("cash1000", "Set Money 1000 (mp_startmoney)");
    menu.AddItem("cash5000", "Set Money 5000 (mp_startmoney)");
    menu.AddItem("cash16000", "Set Money 16000 (mp_startmoney)");

    menu.AddItem("bf3", "BF3 (Max Rounds 3)");
    menu.AddItem("bf6", "BF6 (Max Rounds 6)");
    menu.AddItem("bf9", "BF9 (Max Rounds 9)");
    menu.AddItem("bf13", "BF13 (Max Rounds 13)");

    menu.ExitButton = true;
    menu.Display(client, 0);
}

public int MenuHandler(Menu menu, MenuAction action, int client, int item)
{
    if (action != MenuAction_Select)
        return 0;

    char option[32];
    menu.GetItem(item, option, sizeof(option));

    if (StrEqual(option, "kickbots"))
        ServerCommand("bot_kick");

    else if (StrEqual(option, "endwarmup"))
        ServerCommand("mp_warmup_end");

    else if (StrEqual(option, "restart"))
        ServerCommand("mp_restartgame 1");

    else if (StrEqual(option, "cash1000"))
        ServerCommand("mp_startmoney 1000");

    else if (StrEqual(option, "cash5000"))
        ServerCommand("mp_startmoney 5000");

    else if (StrEqual(option, "cash16000"))
        ServerCommand("mp_startmoney 16000");

    else if (StrEqual(option, "bf3"))
        ServerCommand("mp_maxrounds 3");

    else if (StrEqual(option, "bf6"))
        ServerCommand("mp_maxrounds 6");

    else if (StrEqual(option, "bf9"))
        ServerCommand("mp_maxrounds 9");

    else if (StrEqual(option, "bf13"))
        ServerCommand("mp_maxrounds 13");

    PrintToChat(client, "[Admin] Comando '%s' executado.", option);

    return 0;
}
