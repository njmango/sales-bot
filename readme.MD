# Sales Bot

This bot acts as an alternative to the sim companies exchange, offering free 
listings and automatic notifications upon a listing match (buyer and seller).

## Installation

This branch has been formatted as a basic NPM project with all the relavent 
dependencies listed out in the package.json file. To install, simply clone the repo.

```bash
git clone https://github.com/njmango/sales-bot.git
```

Then install the dependencies.

```bash
npm install
```

## Usage

1. Copy the .env.template file and rename it to .env
2. Fill in the required fields in the .env file
3. deploy the commands using the command below

```bash
npm run deploy
```
4. Start the bot using the command below

```bash
npm run start
```

## Example

This repo is currently in the process of converting all commands over to slash commands as seen below

### Help Command
![image](./img/help%20example.gif)

### List Command
![image](./img/list%20example.gif)